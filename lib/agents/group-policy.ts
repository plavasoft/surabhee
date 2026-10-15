import { createHash } from "crypto";

import { looksAbusive } from "@/lib/agents/abuse";
import { kolkataNow } from "@/lib/agents/clock";
import { GROUP_COPY } from "@/lib/agents/replies";
import type { AdLedgerEntry, GroupDecision } from "@/lib/types";

export type GroupVerdict = {
  decision: GroupDecision;
  reply: string;
  day: string;
  thursday: boolean;
  hash: string;
  recordAd: boolean;
};

const PRICE =
  /₹|\brs\.?\s*\d|\binr\s*\d|\d+\s*(?:per|\/)\s*(?:kg|kilo|bunch)|\d+\s*\/\s*-/i;
const COMMERCE =
  /\b(?:offer|discount|wholesale|for sale|flat\s+\d+\s*%|buy one|limited stock|deal of)\b|https?:\/\/|www\.|ధర|ఆఫర్|అమ్మకం|డిస్కౌంట్|తగ్గింపు|కొనుగోలు|दाम|कीमत|ऑफर|छूट|बिक्री|खरीदें|थोक/i;

export function isBusinessAd(text: string) {
  return PRICE.test(text) || COMMERCE.test(text);
}

export function adHash(text: string) {
  const normal = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normal).digest("hex").slice(0, 16);
}

export function judgeGroupMessage(input: {
  text: string;
  sender: string;
  groupId: string;
  ledger: AdLedgerEntry[];
  preview: boolean;
  now?: Date;
  abusive?: boolean;
}): GroupVerdict {
  const clock = kolkataNow(input.now ?? new Date());
  const hash = adHash(input.text);
  const senderKey = senderKeyOf(input.sender);
  const abusive = input.abusive || looksAbusive(input.text);
  if (abusive) {
    return {
      decision: "block_abuse",
      reply: GROUP_COPY.abuse,
      day: clock.day,
      thursday: clock.thursday,
      hash,
      recordAd: false,
    };
  }
  if (!isBusinessAd(input.text)) {
    return {
      decision: "allow_chat",
      reply: "",
      day: clock.day,
      thursday: clock.thursday,
      hash,
      recordAd: false,
    };
  }
  if (!clock.thursday) {
    return {
      decision: "warn_not_thursday",
      reply: GROUP_COPY.notThursday,
      day: clock.day,
      thursday: false,
      hash,
      recordAd: false,
    };
  }
  const sameDay = input.ledger.filter(
    (entry) =>
      entry.groupId === input.groupId &&
      entry.day === clock.day &&
      entry.preview === input.preview,
  );
  const repeat = sameDay.some((entry) => entry.hash === hash || entry.senderKey === senderKey);
  if (repeat) {
    return {
      decision: "warn_repeat",
      reply: GROUP_COPY.repeat,
      day: clock.day,
      thursday: true,
      hash,
      recordAd: false,
    };
  }
  return {
    decision: "allow_ad",
    reply: "",
    day: clock.day,
    thursday: true,
    hash,
    recordAd: true,
  };
}

export function senderKeyOf(sender: string) {
  return sender.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
}
