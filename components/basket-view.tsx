"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-provider";
import { useCatalog } from "@/components/use-catalog";
import { VegName } from "@/components/veg-name";
import { Button, buttonVariants } from "@/components/ui/button";
import { VegetableCard } from "@/components/vegetable-card";
import { formatQty, inr, roundMoney, unitWord } from "@/lib/format";
import { cn } from "cn";

export function BasketView() {
  const { lines, ready, setQty } = useCart();
  const { catalog, loading, error, reload } = useCatalog();
  const vegetables = catalog?.vegetables ?? [];

  const rows = lines.map((line) => ({
    line,
    vegetable: vegetables.find((item) => item.id === line.id) ?? null,
  }));
  const known = rows.filter((row) => row.vegetable);
  const total = roundMoney(
    known.reduce((sum, row) => sum + (row.vegetable ? row.vegetable.price * row.line.qty : 0), 0),
  );
  const missing = !loading && rows.some((row) => !row.vegetable);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-4xl text-ink">Basket</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Prices are the ones on the stall now. Placing the order holds this quantity until you pay
        or cancel.
      </p>

      {!ready || loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-card ring-1 ring-border" />
      ) : error ? (
        <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-border">
          <p>{error}</p>
          <Button type="button" className="mt-4 h-11" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      ) : lines.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-card p-8 ring-1 ring-border">
          <p className="font-heading text-2xl">The basket is empty.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bendakaya, gongura, mirapa kayalu, and the rest are on the stall.
          </p>
          <Link href="/" className={cn(buttonVariants({ className: "mt-5 h-11 rounded-full px-5" }))}>
            Back to the stall
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="grid gap-4">
            {rows.map(({ line, vegetable }) =>
              vegetable ? (
                <VegetableCard
                  key={line.id}
                  vegetable={vegetable}
                  qty={line.qty}
                  onQty={(qty) => setQty(line.id, qty)}
                />
              ) : (
                <div key={line.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                  <p className="font-medium">This vegetable has left the stall.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 h-11"
                    onClick={() => setQty(line.id, 0)}
                  >
                    Remove it
                  </Button>
                </div>
              ),
            )}
          </div>
          <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="text-2xl">To pay</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {known.map(({ line, vegetable }) =>
                vegetable ? (
                  <li key={line.id} className="flex items-start justify-between gap-3">
                    <VegName
                      nameTe={vegetable.nameTe}
                      roman={vegetable.roman}
                      nameEn={vegetable.nameEn}
                      teClassName="text-lg"
                    />
                    <span className="shrink-0 text-right">
                      {formatQty(line.qty)} {unitWord(vegetable.unit, line.qty)}
                      <span className="block">{inr(vegetable.price * line.qty)}</span>
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
            <p className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span>Total</span>
              <span className="font-heading text-3xl">{inr(total)}</span>
            </p>
            {missing ? (
              <p className="mt-3 text-sm text-destructive">
                Remove vegetables that are no longer on the stall before checkout.
              </p>
            ) : null}
            <Link
              href="/checkout"
              aria-disabled={missing}
              className={cn(
                buttonVariants({ className: "mt-4 h-12 w-full rounded-full text-base" }),
                missing && "pointer-events-none opacity-50",
              )}
            >
              Add phone and address
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
