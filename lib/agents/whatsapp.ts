import { createHmac, timingSafeEqual } from "crypto";

import { handleGroupMessage } from "@/lib/agents/group-agent";
import { handleIntake, type IntakeResult } from "@/lib/agents/order-agent";

type WaMessage = {
  from?: string;
  id?: string;
  type?: string;
  group_id?: string;
  text?: { body?: string };
  audio?: { id?: string; mime_type?: string };
  image?: { caption?: string };
  video?: { caption?: string };
};

type WaValue = {
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: WaMessage[];
  metadata?: { phone_number_id?: string };
  group_id?: string;
};

export function whatsappSignatureOk(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const got = header.slice("sha256=".length);
  const actual = Buffer.from(got);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

export function verifyTokenOk(token: string | null) {
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected || !token) return false;
  const actual = Buffer.from(token);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

export async function handleWhatsAppPayload(raw: unknown, origin: string) {
  const messages = collectMessages(raw);
  const results: IntakeResult[] = [];
  const group: { decision: string; reply: string }[] = [];
  for (const item of messages) {
    if (item.groupId) {
      const judged = await handleGroupMessage({
        groupId: item.groupId,
        sender: item.name || item.from,
        text: item.text,
      });
      if (judged.reply && item.from) {
        try {
          await sendWhatsAppText(item.from, judged.reply);
        } catch (error) {
          console.error(error);
        }
      }
      group.push({ decision: judged.decision, reply: judged.reply });
      continue;
    }
    let audio: { bytes: Buffer; mime: string } | null = null;
    if (item.audioId) {
      try {
        audio = await downloadWhatsAppMedia(item.audioId);
      } catch (error) {
        console.error(error);
      }
    }
    const result = await handleIntake({
      channel: "whatsapp",
      kind: item.audioId ? "voice" : "text",
      from: item.from,
      profileName: item.name,
      text: item.text,
      audio,
      origin,
    });
    try {
      await sendWhatsAppText(item.from, result.reply);
    } catch (error) {
      console.error(error);
    }
    results.push(result);
  }
  return { messages: results.length, orders: results.filter((item) => item.orderId).map((item) => item.orderId), group };
}

function collectMessages(raw: unknown) {
  const found: { from: string; name: string; text: string; audioId: string; groupId: string }[] = [];
  if (!raw || typeof raw !== "object") return found;
  const entries = (raw as { entry?: unknown }).entry;
  if (!Array.isArray(entries)) return found;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const changes = (entry as { changes?: unknown }).changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as { value?: WaValue }).value;
      if (!value) continue;
      const contacts = new Map(
        (value.contacts ?? []).map((contact) => [contact.wa_id ?? "", contact.profile?.name ?? ""]),
      );
      for (const message of value.messages ?? []) {
        const from = message.from ?? "";
        if (!from) continue;
        found.push({
          from,
          name: contacts.get(from) ?? "",
          text: message.text?.body || message.image?.caption || message.video?.caption || "",
          audioId: message.type === "audio" ? message.audio?.id || "" : "",
          groupId: message.group_id || value.group_id || "",
        });
      }
    }
  }
  return found;
}

export async function downloadWhatsAppMedia(id: string) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token || !id) return null;
  const meta = await fetch(`https://graph.facebook.com/v21.0/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!meta.ok) return null;
  const body = (await meta.json()) as { url?: string; mime_type?: string };
  if (!body.url) return null;
  const file = await fetch(body.url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!file.ok) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 8_000_000) return null;
  return { bytes, mime: body.mime_type || "audio/ogg" };
}

export async function sendWhatsAppText(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || !body.trim()) return false;
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: body.slice(0, 4000) },
    }),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}
