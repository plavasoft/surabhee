import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import { setTimeout as delay } from "timers/promises";

import { HttpError } from "@/lib/errors";
import { roundMoney, roundQty } from "@/lib/format";
import { seedStore } from "@/lib/seed";
import type {
  AdminState,
  Order,
  OrderItem,
  OrderSource,
  OrderStatus,
  Settings,
  StoreData,
  Vegetable,
  VegetableInput,
} from "@/lib/types";
import { VPA_RE } from "@/lib/validate";
import {
  addressIssue,
  asNumber,
  cleanText,
  districtIssue,
  isGroup,
  isUnit,
  nameIssue,
  normalizePhone,
  orderQtyFitsUnit,
  payeeIssue,
  phoneIssue,
  pincodeIssue,
  priceIssue,
  quantityFitsUnit,
  upiReferenceIssue,
  vpaIssue,
} from "@/lib/validate";

const DIR = path.join(process.env.ANDHRA_THOTA_HOME || process.cwd(), "data");
const FILE = path.join(DIR, "store.json");
const LOCK = path.join(DIR, "store.lock");

function upiInfo(settings: Settings) {
  return {
    vpa: settings.vpa,
    payeeName: settings.payeeName,
    configured: VPA_RE.test(settings.vpa),
  };
}

function adminState(store: StoreData): AdminState {
  return {
    vegetables: store.vegetables,
    orders: [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    settings: store.settings,
  };
}

function isStore(value: unknown): value is StoreData {
  if (!value || typeof value !== "object") return false;
  const record = value as StoreData;
  return (
    Array.isArray(record.vegetables) &&
    Array.isArray(record.orders) &&
    !!record.settings &&
    typeof record.settings.payeeName === "string" &&
    typeof record.settings.vpa === "string"
  );
}

function normalize(store: StoreData) {
  if (!Array.isArray(store.drafts)) store.drafts = [];
  if (!Array.isArray(store.inbox)) store.inbox = [];
  if (!Array.isArray(store.groupEvents)) store.groupEvents = [];
  if (!Array.isArray(store.adLedger)) store.adLedger = [];
  for (const order of store.orders) {
    if (order.source !== "stall" && order.source !== "whatsapp" && order.source !== "sms") {
      order.source = "stall";
    }
  }
  return store;
}

async function persist(store: StoreData) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2));
  await fs.rename(tmp, FILE);
}

async function load(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new HttpError("The stall record is damaged.", 500);
    }
    if (!isStore(parsed)) {
      throw new HttpError("The stall record is damaged.", 500);
    }
    return normalize(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const fresh = seedStore();
      await persist(fresh);
      return fresh;
    }
    throw error;
  }
}

async function acquire() {
  await fs.mkdir(DIR, { recursive: true });
  const started = Date.now();
  for (;;) {
    try {
      const handle = await fs.open(LOCK, "wx");
      await handle.writeFile(String(process.pid));
      await handle.close();
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const stat = await fs.stat(LOCK);
        if (Date.now() - stat.mtimeMs > 5000) {
          await fs.unlink(LOCK).catch(() => undefined);
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() - started > 3000) {
        throw new HttpError("The stall is busy. Try again in a moment.", 503);
      }
      await delay(25);
    }
  }
}

async function release() {
  await fs.unlink(LOCK).catch(() => undefined);
}

export async function withStore<T>(fn: (store: StoreData) => T): Promise<T> {
  await acquire();
  try {
    const store = await load();
    const result = fn(store);
    await persist(store);
    return result;
  } finally {
    await release();
  }
}

async function updateStore<T>(fn: (store: StoreData) => T): Promise<T> {
  return withStore(fn);
}

export async function readStore() {
  await acquire();
  try {
    return await load();
  } finally {
    await release();
  }
}

function requireRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError("The request could not be read.");
  }
  return value as Record<string, unknown>;
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "vegetable";
}

function uniqueId(vegetables: Vegetable[], englishName: string) {
  const base = slugify(englishName);
  if (!vegetables.some((vegetable) => vegetable.id === base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const next = `${base}-${n}`;
    if (!vegetables.some((vegetable) => vegetable.id === next)) return next;
  }
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function readVegetableInput(body: unknown, partial: boolean): Partial<VegetableInput> {
  const record = requireRecord(body);
  const input: Partial<VegetableInput> = {};

  if (!partial || "nameTe" in record) {
    input.nameTe = cleanText(record.nameTe, 60);
  }
  if (!partial || "nameEn" in record) {
    input.nameEn = cleanText(record.nameEn, 60);
  }
  if (!partial || "roman" in record) {
    input.roman = cleanText(record.roman, 60);
  }
  if (!partial || "note" in record) {
    input.note = cleanText(record.note, 180);
  }
  if (!partial || "unit" in record) {
    if (!isUnit(record.unit)) throw new HttpError("Choose kg or bunch.");
    input.unit = record.unit;
  }
  if (!partial || "group" in record) {
    if (!isGroup(record.group)) throw new HttpError("Choose a group.");
    input.group = record.group;
  }
  if (!partial || "price" in record) {
    input.price = roundMoney(asNumber(record.price));
  }
  if (!partial || "quantity" in record) {
    input.quantity = roundQty(asNumber(record.quantity));
  }
  return input;
}

function assertVegetable(vegetable: Vegetable) {
  if (vegetable.nameTe.length < 1) throw new HttpError("Enter the Telugu name.");
  if (vegetable.nameEn.length < 2) throw new HttpError("Enter the English name.");
  if (vegetable.roman.length < 2) {
    throw new HttpError("Enter the name as people say it, such as Benda kaya.");
  }
  const price = priceIssue(vegetable.price);
  if (price) throw new HttpError(price);
  if (!quantityFitsUnit(vegetable.unit, vegetable.quantity)) {
    throw new HttpError(
      vegetable.unit === "bunch"
        ? "Bunch quantity has to be a whole number."
        : "Enter a quantity from 0 to 9999.",
    );
  }
}

function applyPatch(vegetable: Vegetable, patch: Partial<VegetableInput>) {
  if (patch.nameTe !== undefined) vegetable.nameTe = patch.nameTe;
  if (patch.nameEn !== undefined) vegetable.nameEn = patch.nameEn;
  if (patch.roman !== undefined) vegetable.roman = patch.roman;
  if (patch.note !== undefined) vegetable.note = patch.note;
  if (patch.unit !== undefined) vegetable.unit = patch.unit;
  if (patch.group !== undefined) vegetable.group = patch.group;
  if (patch.price !== undefined) vegetable.price = patch.price;
  if (patch.quantity !== undefined) vegetable.quantity = patch.quantity;
  if (vegetable.unit === "bunch") vegetable.quantity = Math.floor(vegetable.quantity);
  assertVegetable(vegetable);
}

function newOrderId(store: StoreData) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = `AT-${randomBytes(4).toString("hex").toUpperCase()}`;
    if (!store.orders.some((order) => order.id === id)) return id;
  }
  return `AT-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function restoreStock(store: StoreData, order: Order) {
  for (const item of order.items) {
    const vegetable = store.vegetables.find((entry) => entry.id === item.vegetableId);
    if (!vegetable) continue;
    vegetable.quantity = roundQty(vegetable.quantity + item.qty);
  }
}

export async function getCatalog() {
  const store = await readStore();
  return {
    vegetables: store.vegetables,
    upi: upiInfo(store.settings),
  };
}

export async function getOrderView(id: string) {
  const store = await readStore();
  const order = store.orders.find((entry) => entry.id === id);
  if (!order) throw new HttpError("That order is not on the desk.", 404);
  return { order, upi: upiInfo(store.settings) };
}

export type PlaceOrderInput = {
  name: string;
  phone: string;
  address: string;
  district: string;
  pincode: string;
  landmark: string;
  items: { id: string; qty: number }[];
  source: OrderSource;
};

export function placeOrderInStore(store: StoreData, input: PlaceOrderInput) {
  const name = cleanText(input.name, 80);
  const phone = normalizePhone(cleanText(input.phone, 20));
  const address = cleanText(input.address, 300).replace(/\s+/g, " ");
  const district = cleanText(input.district, 80);
  const pincode = cleanText(input.pincode, 6);
  const landmark = cleanText(input.landmark, 120).replace(/\s+/g, " ");

  const nameError = nameIssue(name);
  if (nameError) throw new HttpError(nameError);
  const phoneError = phoneIssue(phone);
  if (phoneError) throw new HttpError(phoneError);
  const addressError = addressIssue(address);
  if (addressError) throw new HttpError(addressError);
  const districtError = districtIssue(district);
  if (districtError) throw new HttpError(districtError);
  const pincodeError = pincodeIssue(pincode);
  if (pincodeError) throw new HttpError(pincodeError);

  if (input.items.length === 0 || input.items.length > 30) {
    throw new HttpError("Your basket is empty.");
  }

  const requested = new Map<string, number>();
  for (const item of input.items) {
    const id = cleanText(item.id, 80);
    const qty = roundQty(item.qty);
    if (!id || !Number.isFinite(qty)) throw new HttpError("The basket could not be read.");
    requested.set(id, roundQty((requested.get(id) ?? 0) + qty));
  }

  const items: OrderItem[] = [];
  for (const [id, qty] of requested) {
    const vegetable = store.vegetables.find((entry) => entry.id === id);
    if (!vegetable) {
      throw new HttpError("A vegetable in the basket is no longer on the stall.");
    }
    if (!orderQtyFitsUnit(vegetable.unit, qty)) {
      throw new HttpError(
        vegetable.unit === "kg"
          ? `Choose half-kilo steps for ${vegetable.nameEn}.`
          : `Choose whole bunches for ${vegetable.nameEn}.`,
      );
    }
    if (qty > vegetable.quantity + 1e-9) {
      throw new HttpError(
        vegetable.quantity <= 0
          ? `${vegetable.nameEn} is sold out.`
          : `Only ${roundQty(vegetable.quantity)} ${vegetable.unit === "kg" ? "kg" : "bunches"} of ${vegetable.nameEn} left.`,
      );
    }
    vegetable.quantity = roundQty(vegetable.quantity - qty);
    items.push({
      vegetableId: vegetable.id,
      nameTe: vegetable.nameTe,
      nameEn: vegetable.nameEn,
      roman: vegetable.roman,
      unit: vegetable.unit,
      price: vegetable.price,
      qty,
    });
  }

  const order: Order = {
    id: newOrderId(store),
    createdAt: new Date().toISOString(),
    name,
    phone,
    address,
    district,
    pincode,
    landmark,
    items,
    total: roundMoney(items.reduce((sum, item) => sum + item.price * item.qty, 0)),
    status: "awaiting_payment",
    utr: "",
    paidAt: null,
    source: input.source,
  };
  store.orders.unshift(order);
  return order;
}

export async function createOrder(body: unknown) {
  const record = requireRecord(body);
  if (!Array.isArray(record.items) || record.items.length === 0 || record.items.length > 30) {
    throw new HttpError("Your basket is empty.");
  }
  const items = record.items.map((item) => {
    if (!item || typeof item !== "object") throw new HttpError("The basket could not be read.");
    const line = item as Record<string, unknown>;
    return { id: cleanText(line.id, 80), qty: roundQty(asNumber(line.qty)) };
  });

  return updateStore((store) =>
    placeOrderInStore(store, {
      name: cleanText(record.name, 80),
      phone: cleanText(record.phone, 20),
      address: cleanText(record.address, 300),
      district: cleanText(record.district, 80),
      pincode: cleanText(record.pincode, 6),
      landmark: cleanText(record.landmark, 120),
      items,
      source: "stall",
    }),
  );
}

export async function submitPayment(id: string, body: unknown) {
  const record = requireRecord(body);
  const utr = cleanText(record.utr, 22);
  const issue = upiReferenceIssue(utr);
  if (issue) throw new HttpError(issue);

  return updateStore((store) => {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order) throw new HttpError("That order is not on the desk.", 404);
    if (!VPA_RE.test(store.settings.vpa)) {
      throw new HttpError("Add the farm UPI ID in the admin desk before saving a payment.");
    }
    if (order.status === "cancelled") {
      throw new HttpError("This order was cancelled. Place it again from the stall.");
    }
    if (order.status === "payment_submitted" || order.status === "confirmed") {
      if (order.utr === utr) return order;
      throw new HttpError("A payment reference is already saved for this order.");
    }
    order.utr = utr;
    order.status = "payment_submitted";
    order.paidAt = new Date().toISOString();
    return order;
  });
}

export async function cancelOrder(id: string, actor: "customer" | "admin") {
  return updateStore((store) => {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order) throw new HttpError("That order is not on the desk.", 404);
    if (order.status === "cancelled") return order;
    if (actor === "customer" && order.status !== "awaiting_payment") {
      throw new HttpError(
        "A payment reference is already saved. The farm desk can cancel it and return the vegetables.",
      );
    }
    restoreStock(store, order);
    order.status = "cancelled";
    return order;
  });
}

export async function getAdminState() {
  return adminState(await readStore());
}

export async function addVegetable(body: unknown) {
  const input = readVegetableInput(body, false) as VegetableInput;
  return updateStore((store) => {
    const vegetable: Vegetable = {
      id: uniqueId(store.vegetables, input.nameEn),
      nameTe: input.nameTe,
      nameEn: input.nameEn,
      roman: input.roman,
      unit: input.unit,
      price: input.price,
      quantity: input.quantity,
      note: input.note,
      group: input.group,
    };
    assertVegetable(vegetable);
    store.vegetables.push(vegetable);
    return adminState(store);
  });
}

export async function updateVegetable(id: string, body: unknown) {
  const patch = readVegetableInput(body, true);
  return updateStore((store) => {
    const vegetable = store.vegetables.find((entry) => entry.id === id);
    if (!vegetable) throw new HttpError("That vegetable is not on the stall.", 404);
    applyPatch(vegetable, patch);
    return adminState(store);
  });
}

export async function deleteVegetable(id: string) {
  return updateStore((store) => {
    const index = store.vegetables.findIndex((entry) => entry.id === id);
    if (index === -1) throw new HttpError("That vegetable is not on the stall.", 404);
    store.vegetables.splice(index, 1);
    return adminState(store);
  });
}

export async function updateOrderStatus(id: string, body: unknown) {
  const record = requireRecord(body);
  const status = record.status;
  if (status !== "confirmed" && status !== "cancelled") {
    throw new HttpError("Choose confirmed or cancelled.");
  }
  return updateStore((store) => {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order) throw new HttpError("That order is not on the desk.", 404);
    if (status === "cancelled") {
      if (order.status !== "cancelled") {
        restoreStock(store, order);
        order.status = "cancelled";
      }
    } else if (order.status === "cancelled") {
      throw new HttpError("A cancelled order stays cancelled. Ask the customer to place it again.");
    } else {
      order.status = "confirmed" satisfies OrderStatus;
    }
    return adminState(store);
  });
}

export async function updateSettings(body: unknown) {
  const record = requireRecord(body);
  const vpa = cleanText(record.vpa, 80).replace(/\s+/g, "");
  const payeeName = cleanText(record.payeeName, 50);
  const vpaError = vpaIssue(vpa);
  if (vpaError) throw new HttpError(vpaError);
  const payeeError = payeeIssue(payeeName);
  if (payeeError) throw new HttpError(payeeError);

  return updateStore((store) => {
    store.settings.vpa = vpa;
    store.settings.payeeName = payeeName;
    return adminState(store);
  });
}
