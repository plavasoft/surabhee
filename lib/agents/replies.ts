import type { Script } from "@/lib/agents/parse-order";
import { formatQty, inr, unitWord } from "@/lib/format";
import type { Order, OrderDraft, Vegetable } from "@/lib/types";
import { nameIssue } from "@/lib/validate";

export function orderReply(order: Order, origin: string, script: Script) {
  const lines = order.items
    .map(
      (item) =>
        `${item.nameTe} ${item.roman} — ${formatQty(item.qty)} ${unitWord(item.unit, item.qty)} — ${inr(item.price * item.qty)}`,
    )
    .join("\n");
  const link = `${origin}/pay/${order.id}`;
  const english = `Order ${order.id} is on the stall.\n${lines}\nTotal ${inr(order.total)}\nPay in your UPI app: ${link}\nWe will call ${order.phone} before delivery.`;
  if (script === "te") {
    return `ఆర్డర్ ${order.id} నమోదు అయింది.\n${lines}\nమొత్తం ${inr(order.total)}\nచెల్లింపు లింక్: ${link}\n\n${english}`;
  }
  if (script === "hi") {
    return `ऑर्डर ${order.id} लिख लिया है।\n${lines}\nकुल ${inr(order.total)}\nभुगतान: ${link}\n\n${english}`;
  }
  return english;
}

export function draftReply(draft: OrderDraft, vegetables: Vegetable[], script: Script) {
  const basket = basketLines(draft, vegetables);
  const missing = missingBits(draft);
  const english = `I have:\n${basket}\n\nStill need: ${missing.join(", ")}.\nSend them in one message. Example: Lakshmi, 4-12 Gandhi street, Guntur 522001.`;
  if (script === "te") {
    return `ఇవి నమోదు అయ్యాయి:\n${basket}\n\nఇంకా పంపండి: ${missing.join(", ")}.\n\n${english}`;
  }
  if (script === "hi") {
    return `ये लिख लिया है:\n${basket}\n\nऔर चाहिए: ${missing.join(", ")}.\n\n${english}`;
  }
  return english;
}

export function questionReply(lines: { vegetableId: string; qty: number }[], vegetables: Vegetable[], script: Script) {
  const rows = lines
    .map((line) => vegetables.find((vegetable) => vegetable.id === line.vegetableId))
    .filter((vegetable): vegetable is Vegetable => Boolean(vegetable))
    .map((vegetable) => {
      const left =
        vegetable.quantity <= 0
          ? "sold out"
          : `${formatQty(vegetable.quantity)} ${unitWord(vegetable.unit, vegetable.quantity)} left`;
      return `${vegetable.nameTe} ${vegetable.roman} (${vegetable.nameEn}) — ${inr(vegetable.price)} per ${unitWord(vegetable.unit, 1)}. ${left}.`;
    });
  const english = rows.join("\n");
  if (script === "te") return `ధరలు:\n${english}\nకావాలంటే పరిమాణం, పేరు, చిరునామా, జిల్లా, పిన్ కోడ్ పంపండి.`;
  if (script === "hi") return `दाम:\n${english}\nऑर्डर के लिए मात्रा, नाम, पता, जिला और पिन कोड भेजिए।`;
  return `${english}\nTo order, send the quantity, your name, address, district, and PIN code.`;
}

export function menuReply(vegetables: Vegetable[], script: Script) {
  const rows = vegetables
    .map(
      (vegetable) =>
        `${vegetable.nameTe} ${vegetable.roman} — ${inr(vegetable.price)} / ${unitWord(vegetable.unit, 1)}`,
    )
    .join("\n");
  if (script === "te") return `ఈ రోజు తోటలో:\n${rows}`;
  if (script === "hi") return `आज स्टॉल पर:\n${rows}`;
  return `On the stall today:\n${rows}`;
}

export function howToReply(script: Script) {
  const english =
    "Send the vegetable and quantity, then your name, house address, district, and Andhra Pradesh PIN code.\nExample: 2 kg benda kaya, 1 bunch gongura. Lakshmi, 4-12 Gandhi street, Guntur 522001.";
  if (script === "te") {
    return `కూరగాయ, పరిమాణం, పేరు, ఇల్లు, జిల్లా, పిన్ కోడ్ పంపండి.\nఉదాహరణ: 2 కిలో బెండకాయ, 1 కట్ట గోంగూర. లక్ష్మి, 4-12 గాంధీ వీధి, గుంటూరు 522001.\n\n${english}`;
  }
  if (script === "hi") {
    return `सब्जी, मात्रा, नाम, पता, जिला और पिन कोड भेजिए।\nउदाहरण: 2 kilo bhindi, 1 guccha dhaniya. Lakshmi, 4-12 Gandhi street, Guntur 522001.\n\n${english}`;
  }
  return english;
}

export function ignoredReply(script: Script) {
  const english = "If this is a vegetable order, send the vegetable, quantity, and delivery address.";
  if (script === "te") return `ఇది కూరగాయల ఆర్డర్ అయితే, కూరగాయ, పరిమాణం, చిరునామా పంపండి.\n${english}`;
  if (script === "hi") return `अगर यह सब्जी का ऑर्डर है, तो सब्जी, मात्रा और पता भेजिए।\n${english}`;
  return english;
}

export function voiceMissReply(script: Script) {
  const english = "I could not read that voice note. Please type the vegetable, quantity, and address.";
  if (script === "te") return `వాయిస్ నోట్ చదవలేకపోయాను. కూరగాయ, పరిమాణం, చిరునామా టైప్ చేయండి.\n${english}`;
  if (script === "hi") return `वॉइस नोट पढ़ नहीं पाया। सब्जी, मात्रा और पता टाइप कीजिए।\n${english}`;
  return english;
}

export function missingBits(draft: OrderDraft) {
  const missing: string[] = [];
  if (nameIssue(draft.name)) missing.push("name");
  if (draft.address.trim().length < 12) missing.push("house and street");
  if (!draft.district) missing.push("district");
  if (!/^5[0-3]\d{4}$/.test(draft.pincode)) missing.push("PIN code");
  return missing;
}

function basketLines(draft: OrderDraft, vegetables: Vegetable[]) {
  return draft.lines
    .map((line) => {
      const vegetable = vegetables.find((entry) => entry.id === line.vegetableId);
      if (!vegetable) return `${line.vegetableId} — ${formatQty(line.qty)}`;
      return `${vegetable.nameTe} ${vegetable.roman} — ${formatQty(line.qty)} ${unitWord(vegetable.unit, line.qty)} — ${inr(vegetable.price)} each`;
    })
    .join("\n");
}

export const GROUP_COPY = {
  notThursday:
    "Business posts are allowed only on Thursday.\nవ్యాపార ప్రకటనలు గురువారం మాత్రమే.\nव्यापार की पोस्ट सिर्फ गुरुवार को भेजें।",
  repeat:
    "This advertisement was already posted today. One business post per member each Thursday.\nఈ ప్రకటన ఈరోజు ఇప్పటికే ఉంది.\nयह विज्ञापन आज पहले ही लग चुका है।",
  abuse:
    "This message is not allowed. It looks abusive or obscene. Please delete it. A person with WhatsApp group admin rights has to remove it — this number cannot delete another member's message.\nఈ సందేశం అనుమతించబడదు. దయచేసి తొలగించండి.\nयह संदेश मना है। कृपया इसे हटा दें।",
};
