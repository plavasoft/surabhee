"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { VegName } from "@/components/veg-name";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatPhone, formatQty, formatWhen, inr, STATUS_LABEL, unitWord } from "@/lib/format";
import type { OrderResponse } from "@/lib/types";
import { cn } from "cn";

export function OrderReceipt({ orderId }: { orderId: string }) {
  const [view, setView] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    api<OrderResponse>(`/api/orders/${orderId}`)
      .then((data) => {
        if (!cancelled) setView(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "The order could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return <div className="mx-auto mt-8 h-72 max-w-3xl animate-pulse rounded-2xl bg-card" />;
  }

  if (error || !view) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-4xl">Order not found</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link href="/" className={cn(buttonVariants({ className: "mt-6 h-11 rounded-full px-5" }))}>
          Back to the stall
        </Link>
      </div>
    );
  }

  const { order } = view;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="text-xs tracking-[0.16em] text-leaf uppercase">{STATUS_LABEL[order.status]}</p>
      <h1 className="mt-2 text-4xl text-ink">Order {order.id}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{formatWhen(order.createdAt)}</p>
      {order.status === "payment_submitted" ? (
        <p className="mt-4 text-sm leading-6">
          The reference is saved. The farm will match it in their UPI app, then pack the
          vegetables and call {formatPhone(order.phone)}.
        </p>
      ) : order.status === "confirmed" ? (
        <p className="mt-4 text-sm leading-6">
          The farm confirmed this payment. Keep {formatPhone(order.phone)} nearby for delivery.
        </p>
      ) : order.status === "awaiting_payment" ? (
        <p className="mt-4 text-sm leading-6">
          This order is still waiting for UPI payment.
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6">This order was cancelled.</p>
      )}

      <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="text-lg font-medium">{order.name}</p>
        <p className="font-heading text-3xl">{formatPhone(order.phone)}</p>
        <p className="mt-2 text-sm leading-6">
          {order.address}
          {order.landmark ? `, ${order.landmark}` : ""}
          <br />
          {order.district} {order.pincode}
        </p>
        <ul className="mt-5 grid gap-3 border-t border-border pt-4">
          {order.items.map((item) => (
            <li key={item.vegetableId} className="flex items-start justify-between gap-3">
              <span>
                <VegName
                  nameTe={item.nameTe}
                  roman={item.roman}
                  nameEn={item.nameEn}
                  teClassName="text-xl"
                />
                <span className="text-sm text-muted-foreground">
                  {formatQty(item.qty)} {unitWord(item.unit, item.qty)} at {inr(item.price)}
                </span>
              </span>
              <span className="font-medium">{inr(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span>Paid by UPI</span>
          <span className="font-heading text-3xl">{inr(order.total)}</span>
        </p>
        {order.utr ? (
          <p className="mt-3 text-sm">
            UPI reference <span className="font-mono text-base">{order.utr}</span>
          </p>
        ) : null}
      </div>
      <div className="no-print mt-5 flex flex-wrap gap-3">
        {order.status === "awaiting_payment" ? (
          <Link
            href={`/pay/${order.id}`}
            className={cn(buttonVariants({ className: "h-11 rounded-full px-5" }))}
          >
            Continue to UPI
          </Link>
        ) : null}
        <Button type="button" variant="outline" className="h-11" onClick={() => window.print()}>
          Print slip
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", className: "h-11 bg-card px-4" }))}
        >
          Back to the stall
        </Link>
      </div>
    </div>
  );
}
