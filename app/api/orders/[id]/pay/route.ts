import { fail, json } from "@/lib/http";
import { submitPayment } from "@/lib/store";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body: unknown = await request.json();
    const order = await submitPayment(id, body);
    return json({ order });
  } catch (error) {
    return fail(error);
  }
}
