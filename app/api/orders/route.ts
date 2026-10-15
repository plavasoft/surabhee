import { fail, json } from "@/lib/http";
import { createOrder } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const order = await createOrder(body);
    return json({ order }, 201);
  } catch (error) {
    return fail(error);
  }
}
