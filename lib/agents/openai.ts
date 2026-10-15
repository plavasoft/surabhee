import { DISTRICTS } from "@/lib/districts";
import type { Vegetable } from "@/lib/types";

const TIMEOUT_MS = 8000;

type ModerationResult = {
  results?: { categories?: Record<string, boolean> }[];
};

export async function remoteAbuse(text: string) {
  const key = process.env.OPENAI_API_KEY;
  const sample = text.trim();
  if (!key || !sample) return false;
  try {
    const data = await openaiJson<ModerationResult>("/v1/moderations", {
      model: "omni-moderation-latest",
      input: sample.slice(0, 4000),
    });
    const categories = data.results?.[0]?.categories ?? {};
    return Boolean(
      categories.sexual || categories["sexual/minors"] || categories["harassment/threatening"],
    );
  } catch {
    return false;
  }
}

export async function transcribeAudio(bytes: Buffer, mime: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || bytes.length === 0) return null;
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime || "audio/ogg" }), "note.ogg");
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { text?: string };
  const text = data.text?.trim() ?? "";
  return text || null;
}

export type ModelOrder = {
  intent: "order" | "question" | "menu" | "other";
  name: string;
  address: string;
  district: string;
  pincode: string;
  landmark: string;
  items: { id: string; qty: number }[];
};

export async function extractOrder(text: string, vegetables: Vegetable[]): Promise<ModelOrder | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const catalog = vegetables
    .map((vegetable) => `${vegetable.id} | ${vegetable.nameTe} | ${vegetable.roman} | ${vegetable.nameEn} | ${vegetable.unit}`)
    .join("\n");
  try {
    const data = await openaiJson<{ choices?: { message?: { content?: string } }[] }>(
      "/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract a vegetable order for a farm stall in Andhra Pradesh. Reply with JSON only: {\"intent\":\"order|question|menu|other\",\"name\":\"\",\"address\":\"\",\"district\":\"\",\"pincode\":\"\",\"landmark\":\"\",\"items\":[{\"id\":\"\",\"qty\":1}]}. Use only ids from the catalog. District must be one of the given districts or empty. Quantities are kilograms or bunches as the catalog unit says. Do not invent items.",
          },
          {
            role: "user",
            content: `Districts: ${DISTRICTS.join(", ")}\nCatalog:\n${catalog}\n\nMessage:\n${text.slice(0, 2000)}`,
          },
        ],
      },
    );
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return sanitizeModelOrder(JSON.parse(content) as unknown, vegetables);
  } catch {
    return null;
  }
}

function sanitizeModelOrder(value: unknown, vegetables: Vegetable[]): ModelOrder | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const intent = record.intent;
  if (intent !== "order" && intent !== "question" && intent !== "menu" && intent !== "other") {
    return null;
  }
  const known = new Set(vegetables.map((vegetable) => vegetable.id));
  const items: { id: string; qty: number }[] = [];
  if (Array.isArray(record.items)) {
    for (const item of record.items) {
      if (!item || typeof item !== "object") continue;
      const line = item as Record<string, unknown>;
      const id = typeof line.id === "string" ? line.id : "";
      const qty = typeof line.qty === "number" ? line.qty : Number(line.qty);
      if (!known.has(id) || !Number.isFinite(qty) || qty <= 0 || qty > 100) continue;
      items.push({ id, qty });
    }
  }
  const district = typeof record.district === "string" ? record.district : "";
  return {
    intent,
    name: typeof record.name === "string" ? record.name.slice(0, 80) : "",
    address: typeof record.address === "string" ? record.address.slice(0, 300) : "",
    district: (DISTRICTS as readonly string[]).includes(district) ? district : "",
    pincode: typeof record.pincode === "string" ? record.pincode.replace(/\D/g, "").slice(0, 6) : "",
    landmark: typeof record.landmark === "string" ? record.landmark.slice(0, 120) : "",
    items,
  };
}

async function openaiJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`https://api.openai.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  return (await response.json()) as T;
}
