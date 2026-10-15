import { cookies } from "next/headers";

import { COOKIE } from "@/lib/auth";
import { fail, json } from "@/lib/http";

export async function POST() {
  try {
    const jar = await cookies();
    jar.delete(COOKIE);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
