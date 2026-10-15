"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { useCatalog } from "@/components/use-catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VegetableCard } from "@/components/vegetable-card";
import { formatQty, inr, maxBuyable, unitWord } from "@/lib/format";
import type { Group, Vegetable } from "@/lib/types";
import { cn } from "cn";

const FILTERS: { id: "all" | Group; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vegetable", label: "Vegetables" },
  { id: "leafy", label: "Greens" },
  { id: "chilli", label: "Chillies" },
];

const BOARD = ["gongura", "bendakaya", "vankaya", "thotakura"];

function boardItems(vegetables: Vegetable[]) {
  const picked = BOARD.map((id) => vegetables.find((vegetable) => vegetable.id === id)).filter(
    (vegetable): vegetable is Vegetable => !!vegetable,
  );
  if (picked.length >= 4) return picked.slice(0, 4);
  for (const vegetable of vegetables) {
    if (picked.some((item) => item.id === vegetable.id)) continue;
    picked.push(vegetable);
    if (picked.length === 4) break;
  }
  return picked;
}

export function ShopHome() {
  const { catalog, error, loading, reload } = useCatalog();
  const { lines, setQty } = useCart();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const vegetables = useMemo(() => catalog?.vegetables ?? [], [catalog]);

  useEffect(() => {
    if (!catalog) return;
    for (const line of lines) {
      const vegetable = vegetables.find((item) => item.id === line.id);
      const max = vegetable ? maxBuyable(vegetable.unit, vegetable.quantity) : 0;
      const next = Math.min(line.qty, max);
      if (next !== line.qty) setQty(line.id, next);
    }
  }, [catalog, lines, setQty, vegetables]);

  const visible = vegetables.filter((vegetable) => {
    const haystack = `${vegetable.nameTe} ${vegetable.nameEn} ${vegetable.roman}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesFilter = filter === "all" || vegetable.group === filter;
    return matchesQuery && matchesFilter;
  });

  const total = lines.reduce((sum, line) => {
    const vegetable = vegetables.find((item) => item.id === line.id);
    return sum + (vegetable ? vegetable.price * line.qty : 0);
  }, 0);

  return (
    <div className={lines.length > 0 ? "pb-24 md:pb-0" : undefined}>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1.15fr_0.85fr] md:py-16">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-leaf uppercase">
            Andhra Pradesh · Organically grown
          </p>
          <h1 className="mt-3 max-w-xl text-4xl leading-[1.05] text-ink sm:text-6xl">
            The thota, packed for your kitchen.
          </h1>
          <p lang="te" className="font-telugu mt-4 max-w-xl text-xl text-ink/90">
            రసాయనాలు లేకుండా పెంచిన కూరగాయలు, ఆంధ్రప్రదేశ్ ఇంటికి.
          </p>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
            Choose the vegetables, leave a mobile number and address in Andhra Pradesh, and pay
            the farm with any UPI app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#stall" className={cn(buttonVariants({ className: "h-11 rounded-full px-5" }))}>
              Shop the stall
            </a>
            <a
              href="#how"
              className={cn(
                buttonVariants({ variant: "outline", className: "h-11 rounded-full bg-card px-5" }),
              )}
            >
              How UPI payment works
            </a>
          </div>
        </div>
        <aside className="board rounded-3xl p-6 sm:p-7">
          <p className="text-xs tracking-[0.2em] text-[#e7c56a]">TODAY ON THE STALL</p>
          {loading ? (
            <p className="mt-6 text-sm text-[#f6edd8]/70">Reading the board…</p>
          ) : error ? (
            <p className="mt-6 text-sm">The board could not be read.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10">
              {boardItems(vegetables).map((vegetable) => (
                <li key={vegetable.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span>
                    <span lang="te" className="font-telugu block text-2xl">
                      {vegetable.nameTe}
                    </span>
                    <span className="text-sm text-[#f6edd8]/70">
                      {vegetable.roman} · {vegetable.nameEn}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-heading text-xl text-[#f2c14e]">{inr(vegetable.price)}</span>
                    <span className="block text-xs text-[#f6edd8]/60">
                      / {unitWord(vegetable.unit, 1)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      <section id="stall" className="scroll-mt-24 mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl text-ink">The stall</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Telugu name, the name as it is spoken, then English. Leafy bunches are sold by the
              kattu. The rest are sold by the kilo, in half-kilo steps.
            </p>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search బెండకాయ, okra, gongura…"
            aria-label="Search vegetables"
            className="h-11 bg-card sm:max-w-xs"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                filter === item.id ? "bg-leaf text-primary-foreground" : "bg-card ring-1 ring-border",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-2xl bg-card ring-1 ring-border" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-border">
            <p className="font-medium">The stall did not load.</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button type="button" className="mt-4 h-11" onClick={() => void reload()}>
              Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-border">
            <p className="font-medium">
              {vegetables.length === 0
                ? "The stall is empty."
                : "Nothing on the stall matches that search."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {vegetables.length === 0
                ? "Add a vegetable from the admin desk."
                : "Try a Telugu name, Benda kaya, or the English name."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((vegetable) => (
              <VegetableCard
                key={vegetable.id}
                vegetable={vegetable}
                qty={lines.find((line) => line.id === vegetable.id)?.qty ?? 0}
                onQty={(qty) => setQty(vegetable.id, qty)}
              />
            ))}
          </div>
        )}
      </section>

      <section id="how" className="scroll-mt-24 border-t border-border/80">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Pick from the stall",
              body: "Half kilos for gourds and beans. Whole bunches for kothi mera, thota kura, and gongura.",
            },
            {
              n: "02",
              title: "Leave a number and address",
              body: "Name, 10-digit mobile, house and village, Andhra Pradesh district, and PIN code.",
            },
            {
              n: "03",
              title: "Pay with UPI",
              body: "Scan the farm QR in GPay, PhonePe, Paytm, or BHIM, then save the 12-digit reference.",
            },
          ].map((step) => (
            <div key={step.n}>
              <p className="font-heading text-turmeric">{step.n}</p>
              <h2 className="mt-2 text-2xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {lines.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
          <Link
            href="/cart"
            className={cn(buttonVariants({ className: "h-12 w-full rounded-full text-base" }))}
          >
            Basket · {formatQty(lines.length)} {lines.length === 1 ? "kind" : "kinds"} · {inr(total)}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
