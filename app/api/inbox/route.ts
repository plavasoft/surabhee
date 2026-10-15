import { connection } from "next/server";

import { handleIntake, inboxDesk } from "@/lib/agents/order-agent";
import { fail, json, publicOrigin, requireAdmin } from "@/lib/http";

export async function GET() {
  try {
    await connection();
    await requireAdmin();
    return json(await inboxDesk());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const channel = record.channel === "sms" ? "sms" : "whatsapp";
    const kind = record.kind === "voice" ? "voice" : channel === "sms" ? "sms" : "text";
    const audio = readAudio(record.audioBase64, record.mime);
    const origin = publicOrigin(request);
    const result = await handleIntake({
      channel,
      kind,
      from: typeof record.from === "string" ? record.from : "",
      profileName: typeof record.name === "string" ? record.name : "",
      text: typeof record.text === "string" ? record.text : "",
      transcript: typeof record.transcript === "string" ? record.transcript : "",
      audio,
      origin,
    });
    return json({
      reply: result.reply,
      outcome: result.outcome,
      orderId: result.orderId,
      event: result.event,
    });
  } catch (error) {
    return fail(error);
  }
}

function readAudio(value: unknown, mime: unknown) {
  if (typeof value !== "string" || value.length < 8) return null;
  const bytes = Buffer.from(value, "base64");
  if (bytes.length === 0 || bytes.length > 8_000_000) return null;
  return { bytes, mime: typeof mime === "string" && mime ? mime : "audio/ogg" };
}
