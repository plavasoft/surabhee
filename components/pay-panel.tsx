"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { Field, fieldClass } from "@/components/field";
import { VegName } from "@/components/veg-name";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { formatPhone, formatQty, inr, STATUS_LABEL, unitWord } from "@/lib/format";
import type { Order, OrderResponse } from "@/lib/types";
import { upiPayUri } from "@/lib/upi";
import { upiReferenceIssue } from "@/lib/validate";
import { cn } from "cn";

export function PayPanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [view, setView] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<{ uri: string; src: string } | null>(null);
  const [utr, setUtr] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load(id: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api<OrderResponse>(`/api/orders/${id}`);
      setView(data);
      if (data.order.status === "payment_submitted" || data.order.status === "confirmed") {
        router.replace(`/order/${data.order.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The order could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    api<OrderResponse>(`/api/orders/${orderId}`)
      .then((data) => {
        if (cancelled) return;
        setView(data);
        setLoading(false);
        if (data.order.status === "payment_submitted" || data.order.status === "confirmed") {
          router.replace(`/order/${data.order.id}`);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "The order could not be loaded.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const order = view?.order;
  const upi = view?.upi;
  const uri =
    order && upi?.configured
      ? upiPayUri({
          vpa: upi.vpa,
          payeeName: upi.payeeName,
          amount: order.total,
          note: `Andhra Thota ${order.id}`,
        })
      : "";

  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    QRCode.toDataURL(uri, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1c2416", light: "#fffaf3" },
    })
      .then((src) => {
        if (!cancelled) setQr({ uri, src });
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setFormError("Copy did not work. Select the UPI ID and copy it yourself.");
    }
  }

  async function saveReference(event: React.FormEvent) {
    event.preventDefault();
    const issue = upiReferenceIssue(utr.trim());
    if (issue) {
      setFormError(issue);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const saved = await api<{ order: Order }>(`/api/orders/${orderId}/pay`, {
        method: "POST",
        body: JSON.stringify({ utr: utr.trim() }),
      });
      router.push(`/order/${saved.order.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "The reference could not be saved.");
      setPending(false);
    }
  }

  async function cancel() {
    setPending(true);
    setFormError(null);
    try {
      await api(`/api/orders/${orderId}/cancel`, { method: "POST" });
      await load(orderId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "The order could not be cancelled.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <div className="mx-auto mt-8 h-80 max-w-5xl animate-pulse rounded-2xl bg-card" />;
  }

  if (error || !order || !upi) {
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

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="order-2 rounded-2xl bg-card p-5 ring-1 ring-border lg:order-1">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{order.id}</p>
        <h1 className="mt-1 text-3xl">Delivery</h1>
        <p className="mt-4 text-lg font-medium">{order.name}</p>
        <p className="font-heading text-2xl">{formatPhone(order.phone)}</p>
        <p className="mt-2 text-sm leading-6">
          {order.address}
          {order.landmark ? `, ${order.landmark}` : ""}
          <br />
          {order.district} {order.pincode}
        </p>
        <ul className="mt-5 grid gap-3 border-t border-border pt-4">
          {order.items.map((item) => (
            <li key={item.vegetableId} className="flex items-start justify-between gap-3 text-sm">
              <span>
                <VegName
                  nameTe={item.nameTe}
                  roman={item.roman}
                  nameEn={item.nameEn}
                  teClassName="text-lg"
                />
                <span className="text-muted-foreground">
                  {formatQty(item.qty)} {unitWord(item.unit, item.qty)} · {inr(item.price)}
                </span>
              </span>
              <span>{inr(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span>Exact amount</span>
          <span className="font-heading text-3xl">{inr(order.total)}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Status: {STATUS_LABEL[order.status]}. These vegetables stay off the stall until you pay
          or cancel.
        </p>
        {order.status === "awaiting_payment" ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 h-11"
            disabled={pending}
            onClick={() => void cancel()}
          >
            Cancel and return the vegetables
          </Button>
        ) : null}
      </section>

      <section className="order-1 lg:order-2">
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border sm:p-7">
          <p className="text-xs font-medium tracking-[0.16em] text-leaf uppercase">UPI</p>
          <h2 className="mt-2 text-3xl">Pay {inr(order.total)}</h2>
          {order.status === "cancelled" ? (
            <p className="mt-4 text-sm leading-6">
              This order is cancelled and the vegetables are back on the stall.
            </p>
          ) : !upi.configured ? (
            <div className="mt-4 rounded-2xl bg-[#f6e3b0] p-4 text-sm leading-6 text-ink">
              The farm UPI ID is not saved yet, so this screen cannot open a payment. Your phone
              number and address are with the order {order.id}. Add the UPI ID in the admin desk,
              then refresh this page.
            </div>
          ) : (
            <div className="mt-5 grid gap-5">
              <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
                {qr && qr.uri === uri ? (
                  // The QR is a generated data URL, which next/image does not serve.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr.src}
                    alt={`UPI QR code for ${order.id}, amount ${inr(order.total)}`}
                    className="w-full max-w-[220px] rounded-xl ring-1 ring-border"
                  />
                ) : (
                  <div className="grid h-48 place-items-center rounded-xl bg-muted text-sm">
                    Preparing the QR…
                  </div>
                )}
                <div className="grid gap-3 text-sm">
                  <p>
                    Scan with GPay, PhonePe, Paytm, or BHIM. On a phone, open the UPI app directly.
                    Pay the exact amount. The note should read Andhra Thota {order.id}.
                  </p>
                  <p>
                    <span className="text-muted-foreground">UPI ID</span>
                    <span className="mt-1 block font-mono text-lg text-ink">{upi.vpa}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Name in the app</span>
                    <span className="mt-1 block">{upi.payeeName}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => void copy("upi", upi.vpa)}
                    >
                      {copied === "upi" ? "Copied" : "Copy UPI ID"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => void copy("amount", order.total.toFixed(2))}
                    >
                      {copied === "amount" ? "Copied" : "Copy amount"}
                    </Button>
                    <a href={uri} className={cn(buttonVariants({ className: "h-10 rounded-lg px-3" }))}>
                      Open UPI app
                    </a>
                  </div>
                </div>
              </div>
              <form onSubmit={saveReference} className="grid gap-3 border-t border-border pt-4">
                <Field
                  label="UPI reference"
                  hint="After the app says success, paste the 12-digit UTR. The farm matches it before packing."
                >
                  <Input
                    value={utr}
                    onChange={(event) => setUtr(event.target.value.replace(/\s+/g, ""))}
                    inputMode="numeric"
                    autoComplete="off"
                    className={cn(fieldClass, "font-mono tracking-wide")}
                    placeholder="123456789012"
                  />
                </Field>
                <p className="text-sm text-muted-foreground">
                  Andhra Thota never asks for your UPI PIN. You pay inside your own app.
                </p>
                <Button type="submit" className="h-12 rounded-full text-base" disabled={pending}>
                  {pending ? "Saving…" : "I have paid — save the reference"}
                </Button>
              </form>
            </div>
          )}
          {formError ? (
            <p className="mt-4 rounded-xl bg-[#fde8e4] px-3 py-2 text-sm text-chili" role="alert">
              {formError}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
