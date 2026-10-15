import { ALIASES } from "@/lib/agents/aliases";
import { DISTRICTS, type District } from "@/lib/districts";
import type { Unit, Vegetable } from "@/lib/types";

export type Script = "te" | "hi" | "en";

export type ParsedLine = {
  vegetableId: string;
  qty: number;
  assumed: boolean;
};

export type ParsedMessage = {
  script: Script;
  intent: "order" | "question" | "menu" | "other";
  lines: ParsedLine[];
  name: string;
  address: string;
  district: string;
  pincode: string;
  landmark: string;
};

const NUMBER_WORDS: [string, number][] = [
  ["one and a half", 1.5],
  ["ఒకటిన్నర", 1.5],
  ["डेढ़", 1.5],
  ["dedh", 1.5],
  ["ఎనిమిది", 8],
  ["తొమ్మిది", 9],
  ["నాలుగు", 4],
  ["enimidi", 8],
  ["tommidi", 9],
  ["naalugu", 4],
  ["nalugu", 4],
  ["రెండు", 2],
  ["మూడు", 3],
  ["ఒకటి", 1],
  ["paanch", 5],
  ["पांच", 5],
  ["पाँच", 5],
  ["आधा", 0.5],
  ["आधी", 0.5],
  ["rendu", 2],
  ["moodu", 3],
  ["okati", 1],
  ["three", 3],
  ["seven", 7],
  ["eight", 8],
  ["four", 4],
  ["five", 5],
  ["nine", 9],
  ["aidu", 5],
  ["aaru", 6],
  ["padi", 10],
  ["ఐదు", 5],
  ["ఆరు", 6],
  ["ఏడు", 7],
  ["పది", 10],
  ["तीन", 3],
  ["चार", 4],
  ["सात", 7],
  ["आठ", 8],
  ["नौ", 9],
  ["दस", 10],
  ["छह", 6],
  ["एक", 1],
  ["दो", 2],
  ["panch", 5],
  ["chhe", 6],
  ["cheh", 6],
  ["saat", 7],
  ["aath", 8],
  ["half", 0.5],
  ["aadha", 0.5],
  ["adha", 0.5],
  ["అర", 0.5],
  ["one", 1],
  ["two", 2],
  ["six", 6],
  ["ten", 10],
  ["das", 10],
  ["nau", 9],
  ["teen", 3],
  ["char", 4],
  ["edu", 7],
  ["ek", 1],
  ["do", 2],
];

const KG = "kg|kgs|kilo|kilos|kilogram|kilograms|కిలోలు|కిలో|किलो";
const BUNCH = "bunches|bunch|kattu|katte|guccha|गुच्छे|गुच्छा|కట్టలు|కట్ట";

const DISTRICT_ALIASES: [string, District][] = [
  ["sri potti sriramulu nellore", "Sri Potti Sriramulu Nellore"],
  ["dr. b.r. ambedkar konaseema", "Dr. B.R. Ambedkar Konaseema"],
  ["parvathipuram manyam", "Parvathipuram Manyam"],
  ["alluri sitharama raju", "Alluri Sitharama Raju"],
  ["west godavari", "West Godavari"],
  ["east godavari", "East Godavari"],
  ["sri sathya sai", "Sri Sathya Sai"],
  ["ysr kadapa", "YSR Kadapa"],
  ["anantapuramu", "Anantapuramu"],
  ["visakhapatnam", "Visakhapatnam"],
  ["vizianagaram", "Vizianagaram"],
  ["rajamahendravaram", "East Godavari"],
  ["rajahmundry", "East Godavari"],
  ["రాజమండ్రి", "East Godavari"],
  ["anantapur", "Anantapuramu"],
  ["అనంతపురం", "Anantapuramu"],
  ["vijayawada", "NTR"],
  ["bezawada", "NTR"],
  ["విజయవాడ", "NTR"],
  ["visakhapatnam", "Visakhapatnam"],
  ["విశాఖపట్నం", "Visakhapatnam"],
  ["vizag", "Visakhapatnam"],
  ["nellore", "Sri Potti Sriramulu Nellore"],
  ["నెల్లూరు", "Sri Potti Sriramulu Nellore"],
  ["cuddapah", "YSR Kadapa"],
  ["kadapa", "YSR Kadapa"],
  ["కడప", "YSR Kadapa"],
  ["kakinada", "Kakinada"],
  ["కాకినాడ", "Kakinada"],
  ["srikakulam", "Srikakulam"],
  ["శ్రీకాకుళం", "Srikakulam"],
  ["tirupathi", "Tirupati"],
  ["tirupati", "Tirupati"],
  ["తిరుపతి", "Tirupati"],
  ["kurnool", "Kurnool"],
  ["కర్నూలు", "Kurnool"],
  ["guntur", "Guntur"],
  ["గుంటూరు", "Guntur"],
  ["eluru", "Eluru"],
  ["ఏలూరు", "Eluru"],
  ["ongole", "Prakasam"],
  ["prakasam", "Prakasam"],
  ["ప్రకాశం", "Prakasam"],
  ["chittoor", "Chittoor"],
  ["చిత్తూరు", "Chittoor"],
  ["nandyal", "Nandyal"],
  ["నంద్యాల", "Nandyal"],
  ["bapatla", "Bapatla"],
  ["బాపట్ల", "Bapatla"],
  ["palnadu", "Palnadu"],
  ["పల్నాడు", "Palnadu"],
  ["anakapalli", "Anakapalli"],
  ["అనకాపల్లి", "Anakapalli"],
  ["annamayya", "Annamayya"],
  ["krishna", "Krishna"],
  ["కృష్ణా", "Krishna"],
];

type Hit = { id: string; start: number; end: number };
type QuantitySpan = {
  start: number;
  end: number;
  qty: number;
  unit: "kg" | "bunch" | null;
  kind: "unit" | "bare";
};

export function scriptOf(text: string): Script {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/\b(chahiye|bhejo|bhej do|mera naam|kitna)\b/i.test(text)) return "hi";
  return "en";
}

export function isGreeting(text: string) {
  return /^(?:hi|hii|hello|hey|namaste|namaskaram|నమస్కారం|నమస్తే|హలో|हाय|हैलो|नमस्ते)[.!\s]*$/i.test(
    text.trim(),
  );
}

export function parseMessage(text: string, vegetables: Vegetable[]): ParsedMessage {
  const script = scriptOf(text);
  const known = new Set(vegetables.map((vegetable) => vegetable.id));
  const hits = findVegetables(text, known);
  const byId = new Map(vegetables.map((vegetable) => [vegetable.id, vegetable]));
  const quantities = findQuantities(text);
  const used = new Set<number>();
  const lines = hits
    .map((hit) => {
      const vegetable = byId.get(hit.id);
      const unit = vegetable?.unit ?? "kg";
      const found = nearestQuantity(hit, quantities, used);
      if (!found) return { vegetableId: hit.id, qty: 1, assumed: true };
      return { vegetableId: hit.id, qty: fitQty(unit, found.qty, found.unit), assumed: false };
    })
    .filter((line) => line.qty > 0);

  const contact = readContact(text);
  const explicit = lines.some((line) => !line.assumed);
  const question =
    /(?:\b(?:price|rate|cost|entha|entra|kitna|kitne|stock|available)\b|how much|ధర|ఎంత|भाव|दाम|ఉందా)/i.test(
      text,
    );
  const buy = /(కావాలి|kavali|order|పంపండి|pampandi|chahiye|चाहिए|भेजो|bhejo|ఇవ్వండి|ivvandi|send me|book)/i.test(
    text,
  );
  const menu = /(price list|\bmenu\b|ధరలు|ఏముంది|ఏమి ఉన్నాయి|what do you have)/i.test(text);
  let intent: ParsedMessage["intent"] = "other";
  if (menu && !explicit) intent = "menu";
  else if (explicit || (buy && lines.length > 0)) intent = "order";
  else if (question && lines.length > 0) intent = "question";
  else if (lines.length > 0) intent = "order";

  return { script, intent, lines, ...contact };
}

function findVegetables(text: string, known: Set<string>) {
  const haystack = text.toLowerCase();
  const candidates: Hit[] = [];
  for (const [id, aliases] of Object.entries(ALIASES)) {
    if (!known.has(id)) continue;
    for (const alias of aliases) {
      const needle = alias.toLowerCase();
      let from = 0;
      while (from < haystack.length) {
        const index = indexOfAlias(haystack, needle, from);
        if (index < 0) break;
        candidates.push({ id, start: index, end: index + needle.length });
        from = index + Math.max(needle.length, 1);
      }
    }
  }
  candidates.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const chosen: Hit[] = [];
  for (const hit of candidates) {
    if (chosen.some((kept) => rangesOverlap(kept, hit) || kept.id === hit.id)) continue;
    chosen.push(hit);
  }
  chosen.sort((a, b) => a.start - b.start);
  return chosen;
}

function rangesOverlap(a: Hit, b: Hit) {
  return a.start < b.end && b.start < a.end;
}

function indexOfAlias(haystack: string, needle: string, from: number) {
  if (/^[a-z][a-z' -]{0,3}$/.test(needle)) {
    const match = new RegExp(`(?<![a-z])${escapeRegExp(needle)}(?![a-z])`, "g").exec(haystack.slice(from));
    return match ? from + match.index : -1;
  }
  return haystack.indexOf(needle, from);
}

function findQuantities(text: string) {
  const spans: QuantitySpan[] = [];
  const half = new RegExp(
    `(?:one and a half|ఒకటిన్నర|डेढ़|dedh|aadha|adha|half|అర|आधा|आधी)\\s*(${KG}|${BUNCH})`,
    "giu",
  );
  for (const match of text.matchAll(half)) {
    const qty = /one and a half|ఒకటిన్నర|डेढ़|dedh/i.test(match[0]) ? 1.5 : 0.5;
    pushSpan(spans, match, qty, bunchUnit(match[1] ?? "") ? "bunch" : "kg", "unit");
  }
  const paired = new RegExp(`(\\d+(?:[.,]\\d+)?|${wordPattern()})\\s*(${KG}|${BUNCH})`, "giu");
  for (const match of text.matchAll(paired)) {
    const qty = readAmount(match[1] ?? "");
    if (qty === null) continue;
    pushSpan(spans, match, qty, bunchUnit(match[2] ?? "") ? "bunch" : "kg", "unit");
  }
  const bare = new RegExp(`(\\d+(?:[.,]\\d+)?|${wordPattern()})`, "giu");
  for (const match of text.matchAll(bare)) {
    const token = match[1] ?? "";
    if (/^[a-z]+$/i.test(token) && token.length < 4) continue;
    const start = match.index ?? 0;
    if (spans.some((span) => start >= span.start && start < span.end)) continue;
    const qty = readAmount(token);
    if (qty === null) continue;
    pushSpan(spans, match, qty, null, "bare");
  }
  return spans;
}

function pushSpan(
  spans: QuantitySpan[],
  match: RegExpMatchArray,
  qty: number,
  unit: "kg" | "bunch" | null,
  kind: "unit" | "bare",
) {
  const start = match.index ?? 0;
  if (spans.some((span) => start < span.end && start + match[0].length > span.start && span.kind === "unit" && kind === "unit")) {
    return;
  }
  spans.push({ start, end: start + match[0].length, qty, unit, kind });
}

function nearestQuantity(hit: Hit, spans: QuantitySpan[], used: Set<number>) {
  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 0; index < spans.length; index += 1) {
    const span = spans[index];
    if (!span || used.has(index)) continue;
    const gap = span.end <= hit.start ? hit.start - span.end : span.start >= hit.end ? span.start - hit.end : 0;
    if (span.kind === "bare" && gap > 16) continue;
    if (gap > 48) continue;
    const score = gap + (span.kind === "bare" ? 30 : 0);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  const chosen = bestIndex >= 0 ? spans[bestIndex] : undefined;
  if (!chosen) return null;
  used.add(bestIndex);
  return chosen;
}

function readAmount(raw: string) {
  const word = NUMBER_WORDS.find(([label]) => label.toLowerCase() === raw.toLowerCase());
  if (word) return word[1];
  const amount = Number(raw.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) return null;
  if (raw.replace(/\D/g, "").length > 4) return null;
  return amount;
}

function bunchUnit(label: string) {
  return new RegExp(`^(?:${BUNCH})$`, "iu").test(label);
}

function fitQty(unit: Unit, qty: number, hint: "kg" | "bunch" | null) {
  const amount = unit === "bunch" || hint === "bunch" ? Math.round(qty) : Math.round(qty * 2) / 2;
  if (unit === "bunch" && hint === "kg" && Number.isInteger(qty)) return Math.min(100, qty);
  if (amount < (unit === "bunch" ? 1 : 0.5) || amount > 100) return 0;
  if (unit === "bunch" && !Number.isInteger(amount)) return 0;
  return amount;
}

function wordPattern() {
  return [...NUMBER_WORDS]
    .sort((a, b) => b[0].length - a[0].length)
    .map(([label]) => escapeRegExp(label))
    .join("|");
}

function readContact(text: string) {
  const nameMatch = text.match(
    /(?:my name is|i am|నా పేరు|పేరు|मेरा नाम(?: है)?|mera naam(?: hai)?|naam hai|name)\s*[:\-]?\s*([\p{L}][\p{L}\p{M} '-]{1,60})/iu,
  );
  let name = nameMatch ? clipName(nameMatch[1] ?? "") : "";
  if (!name) {
    const lead = text.match(/^([\p{L}][\p{L}\p{M} '-]{1,40}),\s+\S/u);
    if (lead) name = clipName(lead[1] ?? "");
  }
  const labelled = text.match(/(?:address|చిరునామా|पता|pata)\s*[:\-]\s*([^\n]{8,180})/i);
  const pinMatch = text.match(/\b(5[0-3]\d{4})\b/);
  const pincode = pinMatch?.[1] ?? "";
  let address = labelled?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (!address && pincode) {
    const line = text
      .split(/\n|(?<=\.)\s+/)
      .find((part) => part.includes(pincode));
    address = stripOrderWords(line ?? "").replace(/\s+/g, " ").trim();
  }
  if (name && address.toLowerCase().startsWith(name.toLowerCase())) {
    address = address.slice(name.length).replace(/^[\s,:-]+/, "");
  }
  if (address.length < 12) address = "";
  const district = findDistrict(text) ?? "";
  const landmarkMatch = text.match(/(?:landmark|గుర్తు|लैंडमार्क)\s*[:\-]\s*([^\n]{2,80})/i);
  return {
    name,
    address: address.slice(0, 300),
    district,
    pincode,
    landmark: landmarkMatch?.[1]?.trim().slice(0, 120) ?? "",
  };
}

function clipName(raw: string) {
  const cut = raw.split(/,|\n|\baddress\b|\bpata\b|చిరునామా|पता|\bdistrict\b|\bpin\b/i)[0] ?? "";
  const name = cut.trim().replace(/[.!;:]+$/g, "").split(/\s+/).slice(0, 4).join(" ");
  if (/^(ordering|sending|from|here|ok|yes|in)(?:\b|\s)/i.test(name)) return "";
  return name;
}

function findDistrict(text: string) {
  const folded = text.toLowerCase();
  const official = [...DISTRICTS].sort((a, b) => b.length - a.length);
  for (const district of official) {
    if (containsPhrase(folded, district)) return district;
  }
  const aliases = [...DISTRICT_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, district] of aliases) {
    if (containsPhrase(folded, alias)) return district;
  }
  return null;
}

function containsPhrase(haystack: string, alias: string) {
  const needle = alias.toLowerCase();
  if (/^[\u0000-\u024f0-9 .'-]+$/.test(needle)) {
    return new RegExp(`(?<![a-z0-9])${escapeRegExp(needle)}(?![a-z0-9])`, "i").test(haystack);
  }
  return haystack.includes(needle);
}

function stripOrderWords(text: string) {
  let next = text;
  const aliases = Object.values(ALIASES)
    .flat()
    .sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    next = next.replace(new RegExp(escapeRegExp(alias), "ig"), " ");
  }
  return next.replace(/\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilo|kilos|bunch|bunches|kattu|కిలో|కట్ట|किलो)/giu, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
