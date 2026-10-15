import { timingSafeEqual } from "crypto";
import { connection } from "next/server";

import { groupDesk, handleGroupMessage } from "@/lib/agents/group-agent";
import { fail, json, requireAdmin } from "@/lib/http";

export async function GET() {
  try {
    await connection();
    await requireAdmin();
    return json(await groupDesk());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!groupSecretOk(request.headers.get("x-andhra-secret"))) {
      await requireAdmin();
    }
    const body: unknown = await request.json();
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const result = await handleGroupMessage({
      groupId: typeof record.groupId === "string" ? record.groupId : "",
      sender: typeof record.sender === "string" ? record.sender : "",
      text: typeof record.text === "string" ? record.text : "",
      asThursday: record.asThursday === true,
    });
    return json(result);
  } catch (error) {
    return fail(error);
  }
}

function groupSecretOk(header: string | null) {
  const secret = process.env.GROUP_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const actual = Buffer.from(header);
  const wanted = Buffer.from(secret);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}
