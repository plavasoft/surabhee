import { randomBytes } from "crypto";

import { HttpError } from "@/lib/errors";
import { extractOrder, transcribeAudio, type ModelOrder } from "@/lib/agents/openai";
import { isGreeting, parseMessage, scriptOf, type ParsedLine, type ParsedMessage } from "@/lib/agents/parse-order";
import {
  draftReply,
  howToReply,
  ignoredReply,
  menuReply,
  missingBits,
  orderReply,
  questionReply,
  voiceMissReply,
} from "@/lib/agents/replies";
import { placeOrderInStore, readStore, withStore } from "@/lib/store";
import type { InboxEvent, InboxOutcome, OrderDraft, OrderSource, Vegetable } from "@/lib/types";
import { cleanText, nameIssue, normalizePhone, phoneIssue } from "@/lib/validate";

export type IntakeRequest = {
  channel: "whatsapp" | "sms";
  kind: "text" | "voice" | "sms";
  from: string;
  profileName?: string;
  text?: string;
  transcript?: string;
  audio?: { bytes: Buffer; mime: string } | null;
  origin: string;
};

export type IntakeResult = {
  reply: string;
  outcome: InboxOutcome;
  orderId: string | null;
  event: InboxEvent;
};

const MAX_LOG = 120;

export async function inboxDesk() {
  const store = await readStore();
  return {
    inbox: store.inbox.slice(0, 40),
    drafts: store.drafts,
    voiceReady: Boolean(process.env.OPENAI_API_KEY),
    whatsappReady: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    smsReady: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM),
  };
}

export async function handleIntake(request: IntakeRequest): Promise<IntakeResult> {
  const heard = await hear(request);
  if (heard.missingVoice) {
    return finish(request, "", voiceMissReply(scriptOf(request.profileName ?? "")), "need_voice_text", null);
  }
  const text = heard.text;
  let model: ModelOrder | null = null;
  if (process.env.OPENAI_API_KEY && text.trim().length >= 12 && !isGreeting(text)) {
    const snapshot = await readStore();
    const preview = parseMessage(text, snapshot.vegetables);
    if (preview.lines.length === 0 && preview.intent !== "menu") {
      model = await extractOrder(text, snapshot.vegetables);
    }
  }
  return withStore((store) => commit(store, request, text, model));
}

async function hear(request: IntakeRequest) {
  const typed = cleanText(request.text || request.transcript || "", 2000);
  if (typed) return { text: typed, missingVoice: false };
  if (request.kind === "voice" && request.audio && request.audio.bytes.length > 0) {
    const spoken = await transcribeAudio(request.audio.bytes, request.audio.mime);
    if (spoken) return { text: cleanText(spoken, 2000), missingVoice: false };
  }
  if (request.kind === "voice") return { text: "", missingVoice: true };
  return { text: "", missingVoice: false };
}

function commit(
  store: Parameters<typeof placeOrderInStore>[0],
  request: IntakeRequest,
  text: string,
  model: ModelOrder | null,
): IntakeResult {
  const phone = normalizePhone(cleanText(request.from, 20));
  const script = text ? scriptOf(text) : "en";
  if (phoneIssue(phone)) {
    return stored(store, request, text, "Send a 10-digit Indian mobile number.", "rejected", null);
  }
  if (!text.trim()) {
    return stored(store, request, text, ignoredReply(script), "ignored", null);
  }

  const parsed = applyModel(parseMessage(text, store.vegetables), model, store.vegetables);
  const key = `${request.channel}:${phone}`;
  let draft = store.drafts.find((entry) => entry.key === key);
  if (!draft) {
    draft = emptyDraft(key, request.channel, phone);
    store.drafts.unshift(draft);
  }

  if (parsed.intent === "menu") {
    dropEmpty(store, draft);
    return stored(store, request, text, menuReply(store.vegetables, script), "menu", null);
  }
  if (parsed.intent === "question") {
    dropEmpty(store, draft);
    return stored(
      store,
      request,
      text,
      questionReply(parsed.lines, store.vegetables, script),
      "question",
      null,
    );
  }

  const profile = usableName(request.profileName ?? "");
  if (parsed.lines.length > 0) draft.lines = parsed.lines.map(({ vegetableId, qty }) => ({ vegetableId, qty }));
  if (parsed.name && !nameIssue(parsed.name)) draft.name = parsed.name;
  else if (!draft.name && profile) draft.name = profile;
  if (parsed.address) draft.address = parsed.address;
  if (parsed.district) draft.district = parsed.district;
  if (parsed.pincode) draft.pincode = parsed.pincode;
  if (parsed.landmark) draft.landmark = parsed.landmark;
  draft.updatedAt = new Date().toISOString();

  if (draft.lines.length === 0) {
    dropEmpty(store, draft);
    const reply = isGreeting(text) ? howToReply(script) : ignoredReply(script);
    return stored(store, request, text, reply, "ignored", null);
  }

  if (missingBits(draft).length > 0) {
    return stored(store, request, text, draftReply(draft, store.vegetables, script), "draft", null);
  }

  try {
    const order = placeOrderInStore(store, {
      name: draft.name,
      phone: draft.phone,
      address: draft.address,
      district: draft.district,
      pincode: draft.pincode,
      landmark: draft.landmark,
      items: draft.lines.map((line) => ({ id: line.vegetableId, qty: line.qty })),
      source: request.channel satisfies OrderSource,
    });
    store.drafts = store.drafts.filter((entry) => entry.key !== key);
    return stored(store, request, text, orderReply(order, request.origin, script), "order", order.id);
  } catch (error) {
    const message = error instanceof HttpError ? error.message : "The order could not be saved.";
    return stored(store, request, text, `${message}\n\n${draftReply(draft, store.vegetables, script)}`, "draft", null);
  }
}

function applyModel(parsed: ParsedMessage, model: ModelOrder | null, vegetables: Vegetable[]): ParsedMessage {
  if (!model || parsed.lines.length > 0) return parsed;
  const known = new Set(vegetables.map((vegetable) => vegetable.id));
  const lines: ParsedLine[] = model.items
    .filter((item) => known.has(item.id))
    .map((item) => ({ vegetableId: item.id, qty: item.qty, assumed: false }));
  if (lines.length === 0 && model.intent !== "question" && model.intent !== "menu") return parsed;
  return {
    script: parsed.script,
    intent: lines.length > 0 && model.intent === "other" ? "order" : model.intent === "menu" || model.intent === "question" ? model.intent : lines.length > 0 ? "order" : parsed.intent,
    lines: lines.length > 0 ? lines : parsed.lines,
    name: parsed.name || model.name,
    address: parsed.address || model.address,
    district: parsed.district || model.district,
    pincode: parsed.pincode || model.pincode,
    landmark: parsed.landmark || model.landmark,
  };
}

function emptyDraft(key: string, channel: "whatsapp" | "sms", phone: string): OrderDraft {
  return {
    key,
    channel,
    phone,
    name: "",
    address: "",
    district: "",
    pincode: "",
    landmark: "",
    lines: [],
    updatedAt: new Date().toISOString(),
  };
}

function usableName(value: string) {
  const name = cleanText(value, 80).replace(/[^\p{L}\p{M} .'-]/gu, "").trim();
  return nameIssue(name) ? "" : name;
}

function dropEmpty(store: { drafts: OrderDraft[] }, draft: OrderDraft) {
  if (draft.lines.length === 0 && !draft.address && !draft.name) {
    store.drafts = store.drafts.filter((entry) => entry.key !== draft.key);
  }
}

function stored(
  store: { inbox: InboxEvent[]; drafts: OrderDraft[] },
  request: IntakeRequest,
  text: string,
  reply: string,
  outcome: InboxOutcome,
  orderId: string | null,
): IntakeResult {
  const event: InboxEvent = {
    id: `IN-${randomBytes(4).toString("hex").toUpperCase()}`,
    at: new Date().toISOString(),
    channel: request.channel,
    kind: request.kind,
    from: normalizePhone(cleanText(request.from, 20)) || cleanText(request.from, 20),
    name: usableName(request.profileName ?? "") || cleanText(request.profileName ?? "", 80),
    text: text.slice(0, 2000),
    reply,
    outcome,
    orderId,
  };
  store.inbox.unshift(event);
  if (store.inbox.length > MAX_LOG) store.inbox.length = MAX_LOG;
  if (store.drafts.length > 80) store.drafts.length = 80;
  return { reply, outcome, orderId, event };
}

function finish(
  request: IntakeRequest,
  text: string,
  reply: string,
  outcome: InboxOutcome,
  orderId: string | null,
) {
  return withStore((store) => stored(store, request, text, reply, outcome, orderId));
}
