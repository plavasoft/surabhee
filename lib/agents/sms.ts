import { createHmac, timingSafeEqual } from "crypto";

import { handleIntake } from "@/lib/agents/order-agent";

export async function handleSms(from: string, text: string, origin: string, deliver = true) {
  const result = await handleIntake({
    channel: "sms",
    kind: "sms",
    from,
    text,
    origin,
  });
  if (deliver) {
    try {
      await sendTwilioSms(from, result.reply);
    } catch (error) {
      console.error(error);
    }
  }
  return result;
}

export function twilioSignatureOk(url: string, params: URLSearchParams, header: string | null) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true;
  if (!header || !process.env.PUBLIC_BASE_URL) return false;
  const pairs = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const payload = url + pairs.map(([key, value]) => key + value).join("");
  const expected = createHmac("sha1", token).update(payload).digest("base64");
  const actual = Buffer.from(header);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

export function smsSecretOk(header: string | null) {
  const secret = process.env.SMS_SHARED_SECRET;
  if (!secret) return true;
  if (!header) return false;
  const actual = Buffer.from(header);
  const wanted = Buffer.from(secret);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

export function twiml(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message.slice(0, 1500))}</Message></Response>`;
}

async function sendTwilioSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !body.trim()) return false;
  const destination = to.startsWith("+") ? to : `+91${to.replace(/\D/g, "").slice(-10)}`;
  const form = new URLSearchParams({ To: destination, From: from, Body: body.slice(0, 1500) });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
