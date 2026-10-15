import { cookies } from "next/headers";

import { COOKIE, passwordMatches, signSession, usingDefaultPassword } from "@/lib/auth";
import { fail, json } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const password =
      body && typeof body === "object" && "password" in body && typeof body.password === "string"
        ? body.password
        : "";
    if (!passwordMatches(password)) {
      return json({ error: "That password was not recognised." }, 401);
    }
    const jar = await cookies();
    jar.set(COOKIE, signSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return json({ ok: true, usingDefaultPassword: usingDefaultPassword() });
  } catch (error) {
    return fail(error);
  }
}
