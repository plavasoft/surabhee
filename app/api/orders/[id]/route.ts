import { connection } from "next/server";

import { fail, json } from "@/lib/http";
import { getOrderView } from "@/lib/store";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await connection();
    const { id } = await ctx.params;
    return json(await getOrderView(id));
  } catch (error) {
    return fail(error);
  }
}
