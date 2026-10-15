import { cookies } from "next/headers";

import { COOKIE, usingDefaultPassword, verifySession } from "@/lib/auth";
import { fail, json } from "@/lib/http";

export async function GET() {
  try {
    const jar = await cookies();
    return json({
      authenticated: verifySession(jar.get(COOKIE)?.value),
      usingDefaultPassword: usingDefaultPassword(),
    });
  } catch (error) {
    return fail(error);
  }
}
