import { fail, json, publicOrigin } from "@/lib/http";
import { handleWhatsAppPayload, verifyTokenOk, whatsappSignatureOk } from "@/lib/agents/whatsapp";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && verifyTokenOk(token) && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (!whatsappSignatureOk(raw, request.headers.get("x-hub-signature-256"))) {
      return json({ error: "The WhatsApp signature did not match." }, 403);
    }
    let body: unknown = {};
    if (raw.trim()) body = JSON.parse(raw) as unknown;
    const origin = publicOrigin(request);
    return json(await handleWhatsAppPayload(body, origin));
  } catch (error) {
    return fail(error);
  }
}
