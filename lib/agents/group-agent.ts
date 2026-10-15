import { randomBytes } from "crypto";

import { looksAbusive } from "@/lib/agents/abuse";
import { nextThursday, kolkataNow } from "@/lib/agents/clock";
import { remoteAbuse } from "@/lib/agents/openai";
import { adHash, judgeGroupMessage, senderKeyOf } from "@/lib/agents/group-policy";
import { readStore, withStore } from "@/lib/store";
import type { GroupDecision, GroupEvent } from "@/lib/types";
import { cleanText } from "@/lib/validate";

export type GroupRequest = {
  groupId: string;
  sender: string;
  text: string;
  asThursday?: boolean;
};

export type GroupResult = {
  event: GroupEvent;
  decision: GroupDecision;
  reply: string;
  today: ReturnType<typeof kolkataNow>;
};

const MAX_EVENTS = 120;
const MAX_LEDGER = 300;

export async function handleGroupMessage(request: GroupRequest): Promise<GroupResult> {
  const text = cleanText(request.text, 2000);
  const sender = cleanText(request.sender, 80) || "Member";
  const groupId = cleanText(request.groupId, 80) || "stall-group";
  const preview = Boolean(request.asThursday);
  const now = preview ? nextThursday() : new Date();
  const abusive = looksAbusive(text) || (await remoteAbuse(text));
  return withStore((store) => {
    const verdict = judgeGroupMessage({
      text,
      sender,
      groupId,
      ledger: store.adLedger,
      preview,
      now,
      abusive,
    });
    const event: GroupEvent = {
      id: `GR-${randomBytes(4).toString("hex").toUpperCase()}`,
      at: new Date().toISOString(),
      groupId,
      sender,
      text,
      decision: verdict.decision,
      reply: verdict.reply,
      preview,
    };
    store.groupEvents.unshift(event);
    if (store.groupEvents.length > MAX_EVENTS) store.groupEvents.length = MAX_EVENTS;
    if (verdict.recordAd) {
      store.adLedger.unshift({
        groupId,
        day: verdict.day,
        senderKey: senderKeyOf(sender),
        hash: verdict.hash || adHash(text),
        at: event.at,
        preview,
      });
      if (store.adLedger.length > MAX_LEDGER) store.adLedger.length = MAX_LEDGER;
    }
    return {
      event,
      decision: verdict.decision,
      reply: verdict.reply,
      today: kolkataNow(preview ? new Date() : now),
    };
  });
}

export async function groupDesk() {
  const store = await readStore();
  const today = kolkataNow();
  return {
    today,
    events: store.groupEvents.slice(0, 40),
    adsToday: store.adLedger.filter((entry) => entry.day === today.day && !entry.preview).length,
  };
}
