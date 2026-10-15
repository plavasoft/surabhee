import { fail, json, requireAdmin } from "@/lib/http";
import { getAdminState } from "@/lib/store";

export async function GET() {
  try {
    await requireAdmin();
    return json(await getAdminState());
  } catch (error) {
    return fail(error);
  }
}
