import { connection } from "next/server";

import { fail, json } from "@/lib/http";
import { getCatalog } from "@/lib/store";

export async function GET() {
  try {
    await connection();
    return json(await getCatalog());
  } catch (error) {
    return fail(error);
  }
}
