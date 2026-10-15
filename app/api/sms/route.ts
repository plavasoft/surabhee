import { handleSms, smsSecretOk, twilioSignatureOk, twiml } from "@/lib/agents/sms";
import { fail, json, publicOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const origin = publicOrigin(request);
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const form = await request.formData();
      const params = new URLSearchParams();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") params.append(key, value);
      }
      const url = `${process.env.PUBLIC_BASE_URL ?? origin}/api/sms`;
      if (!twilioSignatureOk(url, params, request.headers.get("x-twilio-signature"))) {
        return new Response("Invalid signature", { status: 403 });
      }
      const result = await handleSms(
        String(form.get("From") ?? ""),
        String(form.get("Body") ?? ""),
        origin,
        false,
      );
      return new Response(twiml(result.reply), {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }
    if (!smsSecretOk(request.headers.get("x-andhra-secret"))) {
      return json({ error: "The SMS secret did not match." }, 401);
    }
    const body: unknown = await request.json();
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const from = typeof record.from === "string" ? record.from : "";
    const text = typeof record.text === "string" ? record.text : "";
    const result = await handleSms(from, text, origin, true);
    return json({
      reply: result.reply,
      outcome: result.outcome,
      orderId: result.orderId,
    });
  } catch (error) {
    return fail(error);
  }
}
