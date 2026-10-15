import { fail, json, requireAdmin } from "@/lib/http";
import { updateSettings } from "@/lib/store";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    return json(await updateSettings(body));
  } catch (error) {
    return fail(error);
  }
}
