"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { Field, fieldClass } from "@/components/field";
import { useCatalog } from "@/components/use-catalog";
import { VegName } from "@/components/veg-name";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { DISTRICTS } from "@/lib/districts";
import { inr, roundMoney } from "@/lib/format";
import type { Order } from "@/lib/types";
import {
  addressIssue,
  districtIssue,
  nameIssue,
  normalizePhone,
  phoneIssue,
  pincodeIssue,
} from "@/lib/validate";
import { cn } from "cn";

const districts = [...DISTRICTS].sort((a, b) => a.localeCompare(b, "en"));

export function CheckoutForm() {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const { catalog, loading, error, reload } = useCatalog();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const rows = useMemo(
    () =>
      lines
        .map((line) => ({
          line,
          vegetable: catalog?.vegetables.find((item) => item.id === line.id) ?? null,
        }))
        .filter((row) => row.vegetable),
    [catalog, lines],
  );
  const total = roundMoney(
    rows.reduce((sum, row) => sum + (row.vegetable ? row.vegetable.price * row.line.qty : 0), 0),
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanedName = name.trim();
    const cleanedPhone = normalizePhone(phone);
    const cleanedAddress = address.trim().replace(/\s+/g, " ");
    const cleanedPin = pincode.trim();
    const issue =
      nameIssue(cleanedName) ||
      phoneIssue(cleanedPhone) ||
      addressIssue(cleanedAddress) ||
      districtIssue(district) ||
      pincodeIssue(cleanedPin);
    if (issue) {
      setFormError(issue);
      return;
    }
    if (rows.length === 0) {
      setFormError("Your basket is empty.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const result = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          name: cleanedName,
          phone: cleanedPhone,
          address: cleanedAddress,
          district,
          pincode: cleanedPin,
          landmark,
          items: rows.map((row) => ({ id: row.line.id, qty: row.line.qty })),
        }),
      });
      clear();
      router.push(`/pay/${result.order.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "The order could not be placed.");
      setPending(false);
    }
  }

  if (!ready || loading) {
    return <div className="mx-auto mt-8 h-64 max-w-3xl animate-pulse rounded-2xl bg-card" />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p>{error}</p>
        <Button type="button" className="mt-4 h-11" onClick={() => void reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl">Checkout</h1>
        <p className="mt-2 text-muted-foreground">Add vegetables before leaving an address.</p>
        <Link href="/" className={cn(buttonVariants({ className: "mt-5 h-11 rounded-full px-5" }))}>
          Back to the stall
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.8fr]">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div>
          <h1 className="text-4xl text-ink">Where should it go?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The farm uses this mobile number and address to deliver inside Andhra Pradesh and to
            confirm the UPI payment.
          </p>
        </div>
        <Field label="Name" error={undefined} hint="The person to ask for at the door.">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className={fieldClass}
            required
          />
        </Field>
        <Field label="Mobile number" hint="A 10-digit number that is switched on today.">
          <div className="flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm">
              +91
            </span>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="numeric"
              autoComplete="tel"
              className={cn(fieldClass, "rounded-l-none")}
              placeholder="98XXXXXXXX"
              required
            />
          </div>
        </Field>
        <Field
          label="Address"
          hint="House or door number, street, village or locality."
        >
          <Textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="street-address"
            className="min-h-24 bg-card text-base md:text-base"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="District">
            <Select
              value={district || null}
              onValueChange={(value) => setDistrict(value ?? "")}
            >
              <SelectTrigger className="h-11 w-full bg-card">
                <SelectValue placeholder="Andhra Pradesh district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="PIN code" hint="Andhra Pradesh codes start with 50–53.">
            <Input
              value={pincode}
              onChange={(event) => setPincode(event.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              className={fieldClass}
              required
            />
          </Field>
        </div>
        <Field label="Landmark" hint="Optional. A temple, school, or shop nearby.">
          <Input
            value={landmark}
            onChange={(event) => setLandmark(event.target.value)}
            className={fieldClass}
          />
        </Field>
        {formError ? (
          <p className="rounded-xl bg-[#fde8e4] px-3 py-2 text-sm text-chili" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className="h-12 rounded-full text-base" disabled={pending}>
          {pending ? "Holding the vegetables…" : `Place order · ${inr(total)}`}
        </Button>
      </form>
      <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl">Order</h2>
        <ul className="mt-4 grid gap-3">
          {rows.map(({ line, vegetable }) =>
            vegetable ? (
              <li key={line.id} className="flex items-start justify-between gap-3 text-sm">
                <VegName
                  nameTe={vegetable.nameTe}
                  roman={vegetable.roman}
                  nameEn={vegetable.nameEn}
                  teClassName="text-lg"
                />
                <span className="shrink-0">{inr(vegetable.price * line.qty)}</span>
              </li>
            ) : null,
          )}
        </ul>
        <p className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span>To pay by UPI</span>
          <span className="font-heading text-3xl">{inr(total)}</span>
        </p>
      </aside>
    </div>
  );
}
