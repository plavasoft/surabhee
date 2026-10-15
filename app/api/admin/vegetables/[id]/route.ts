import { fail, json, requireAdmin } from "@/lib/http";
import { deleteVegetable, updateVegetable } from "@/lib/store";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body: unknown = await request.json();
    return json(await updateVegetable(id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    return json(await deleteVegetable(id));
  } catch (error) {
    return fail(error);
  }
}
