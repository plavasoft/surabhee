import { DISTRICTS } from "@/lib/districts";
import { roundMoney, roundQty } from "@/lib/format";
import type { Group, Unit } from "@/lib/types";

export const VPA_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

export function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

export function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
}

export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits;
}

export function isUnit(value: unknown): value is Unit {
  return value === "kg" || value === "bunch";
}

export function isGroup(value: unknown): value is Group {
  return value === "vegetable" || value === "leafy" || value === "chilli";
}

export function quantityFitsUnit(unit: Unit, quantity: number) {
  if (quantity < 0 || quantity > 9999) return false;
  const rounded = roundQty(quantity);
  if (Math.abs(rounded - quantity) > 1e-9) return false;
  if (unit === "bunch") return Number.isInteger(rounded);
  return true;
}

export function orderQtyFitsUnit(unit: Unit, quantity: number) {
  if (!(quantity > 0) || quantity > 100) return false;
  const rounded = roundQty(quantity);
  if (Math.abs(rounded - quantity) > 1e-9) return false;
  if (unit === "bunch") return Number.isInteger(rounded);
  return Math.round(rounded * 2) === rounded * 2;
}

export function nameIssue(value: string) {
  if (value.length < 2) return "Enter the name to ask for at the door.";
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,79}$/u.test(value)) {
    return "Use letters for the name.";
  }
  return null;
}

export function phoneIssue(phone: string) {
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return "Enter a 10-digit mobile number.";
  }
  return null;
}

export function addressIssue(address: string) {
  if (address.length < 12) {
    return "Enter the house, street, and village or locality.";
  }
  return null;
}

export function districtIssue(district: string) {
  if (!(DISTRICTS as readonly string[]).includes(district)) {
    return "Choose a district in Andhra Pradesh.";
  }
  return null;
}

export function pincodeIssue(pincode: string) {
  if (!/^5[0-3]\d{4}$/.test(pincode)) {
    return "Enter an Andhra Pradesh PIN code. Those start with 50, 51, 52, or 53.";
  }
  return null;
}

export function priceIssue(price: number) {
  if (!Number.isFinite(price) || price < 1 || price > 10000) {
    return "Enter a price from ₹1 to ₹10,000.";
  }
  if (Math.abs(roundMoney(price) - price) > 1e-9) {
    return "Use at most two decimal places for the price.";
  }
  return null;
}

export function upiReferenceIssue(utr: string) {
  if (!/^\d{12,22}$/.test(utr)) {
    return "Enter the 12-digit UPI reference from the payment success screen.";
  }
  return null;
}

export function vpaIssue(vpa: string) {
  if (!vpa) return null;
  if (!VPA_RE.test(vpa)) {
    return "Enter a UPI ID such as name@okaxis or name@ybl.";
  }
  return null;
}

export function payeeIssue(name: string) {
  if (name.length < 2 || name.length > 50) {
    return "Enter the name that should show in the UPI app.";
  }
  if (!/^[\p{L}\p{M}0-9 .'-]+$/u.test(name)) {
    return "Use letters and numbers for the UPI display name.";
  }
  return null;
}
