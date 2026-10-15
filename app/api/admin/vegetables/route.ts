import { fail, json, requireAdmin } from "@/lib/http";
import { addVegetable } from "@/lib/store";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    return json(await addVegetable(body), 201);
  } catch (error) {
    return fail(error);
  }
}
