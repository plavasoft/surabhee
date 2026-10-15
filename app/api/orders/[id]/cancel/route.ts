import { fail, json } from "@/lib/http";
import { cancelOrder } from "@/lib/store";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const order = await cancelOrder(id, "customer");
    return json({ order });
  } catch (error) {
    return fail(error);
  }
}
