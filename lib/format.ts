import type { OrderStatus, Unit } from "@/lib/types";

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function roundQty(value: number) {
  return Math.round(value * 10) / 10;
}

export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function unitWord(unit: Unit, amount = 2) {
  if (unit === "kg") return "kg";
  return amount === 1 ? "bunch" : "bunches";
}

export function unitTe(unit: Unit) {
  return unit === "kg" ? "కిలో" : "కట్ట";
}

export function formatPhone(phone: string) {
  if (phone.length !== 10) return phone;
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export function maxBuyable(unit: Unit, available: number) {
  if (available <= 0) return 0;
  if (unit === "bunch") return Math.floor(available);
  return Math.floor(available * 2) / 2;
}

export function stepFor(unit: Unit) {
  return unit === "kg" ? 0.5 : 1;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting UPI",
  payment_submitted: "Reference received",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};
