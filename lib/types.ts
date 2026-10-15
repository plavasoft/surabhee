export type Unit = "kg" | "bunch";

export type Group = "vegetable" | "leafy" | "chilli";

export type Vegetable = {
  id: string;
  nameTe: string;
  nameEn: string;
  roman: string;
  unit: Unit;
  price: number;
  quantity: number;
  note: string;
  group: Group;
};

export type OrderItem = {
  vegetableId: string;
  nameTe: string;
  nameEn: string;
  roman: string;
  unit: Unit;
  price: number;
  qty: number;
};

export type OrderStatus =
  | "awaiting_payment"
  | "payment_submitted"
  | "confirmed"
  | "cancelled";

export type OrderSource = "stall" | "whatsapp" | "sms";

export type Order = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  pincode: string;
  landmark: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  utr: string;
  paidAt: string | null;
  source: OrderSource;
};

export type Settings = {
  vpa: string;
  payeeName: string;
};

export type DraftLine = {
  vegetableId: string;
  qty: number;
};

export type OrderDraft = {
  key: string;
  channel: "whatsapp" | "sms";
  phone: string;
  name: string;
  address: string;
  district: string;
  pincode: string;
  landmark: string;
  lines: DraftLine[];
  updatedAt: string;
};

export type InboxOutcome =
  | "order"
  | "draft"
  | "question"
  | "menu"
  | "ignored"
  | "need_voice_text"
  | "rejected";

export type InboxEvent = {
  id: string;
  at: string;
  channel: "whatsapp" | "sms";
  kind: "text" | "voice" | "sms";
  from: string;
  name: string;
  text: string;
  reply: string;
  outcome: InboxOutcome;
  orderId: string | null;
};

export type GroupDecision =
  | "allow_chat"
  | "allow_ad"
  | "warn_not_thursday"
  | "warn_repeat"
  | "block_abuse";

export type GroupEvent = {
  id: string;
  at: string;
  groupId: string;
  sender: string;
  text: string;
  decision: GroupDecision;
  reply: string;
  preview: boolean;
};

export type AdLedgerEntry = {
  groupId: string;
  day: string;
  senderKey: string;
  hash: string;
  at: string;
  preview: boolean;
};

export type StoreData = {
  vegetables: Vegetable[];
  orders: Order[];
  settings: Settings;
  drafts: OrderDraft[];
  inbox: InboxEvent[];
  groupEvents: GroupEvent[];
  adLedger: AdLedgerEntry[];
};

export type UpiInfo = {
  configured: boolean;
  vpa: string;
  payeeName: string;
};

export type CatalogResponse = {
  vegetables: Vegetable[];
  upi: UpiInfo;
};

export type OrderResponse = {
  order: Order;
  upi: UpiInfo;
};

export type AdminState = {
  vegetables: Vegetable[];
  orders: Order[];
  settings: Settings;
};

export type VegetableInput = {
  nameTe: string;
  nameEn: string;
  roman: string;
  unit: Unit;
  price: number;
  quantity: number;
  note: string;
  group: Group;
};
