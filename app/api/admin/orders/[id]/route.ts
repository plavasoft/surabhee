import { fail, json, requireAdmin } from "@/lib/http";
import { updateOrderStatus } from "@/lib/store";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body: unknown = await request.json();
    return json(await updateOrderStatus(id, body));
  } catch (error) {
    return fail(error);
  }
}
