"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const KEY = "andhra-thota-basket";
const listeners = new Set<() => void>();

export type CartLine = { id: string; qty: number };

type CartValue = {
  lines: CartLine[];
  ready: boolean;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRaw() {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        !!line &&
        typeof line === "object" &&
        typeof (line as CartLine).id === "string" &&
        typeof (line as CartLine).qty === "number" &&
        (line as CartLine).qty > 0,
    );
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  emit();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const lines = useMemo(() => (ready ? parse(raw) : []), [raw, ready]);

  const setQty = useCallback((id: string, qty: number) => {
    const current = parse(readRaw());
    if (qty <= 0) {
      write(current.filter((line) => line.id !== id));
      return;
    }
    const next = Math.round(qty * 10) / 10;
    if (!current.some((line) => line.id === id)) {
      write([...current, { id, qty: next }]);
      return;
    }
    write(current.map((line) => (line.id === id ? { ...line, qty: next } : line)));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo(
    () => ({ lines, ready, setQty, clear }),
    [lines, ready, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Basket is unavailable.");
  return value;
}
