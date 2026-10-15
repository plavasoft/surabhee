import { cookies } from "next/headers";

import { COOKIE, verifySession } from "@/lib/auth";
import { HttpError } from "@/lib/errors";

export async function requireAdmin() {
  const jar = await cookies();
  if (!verifySession(jar.get(COOKIE)?.value)) {
    throw new HttpError("Sign in to the farm desk.", 401);
  }
}

export function publicOrigin(request: Request) {
  const configured = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host && !host.startsWith("0.0.0.0")) {
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    return `${proto}://${host}`;
  }
  return `http://127.0.0.1:${url.port || "43123"}`;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function fail(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) {
    return json({ error: "The request could not be read." }, 400);
  }
  console.error(error);
  return json({ error: "Something went wrong. Please try again." }, 500);
}
