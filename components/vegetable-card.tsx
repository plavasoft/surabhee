"use client";

import { Minus, Plus } from "lucide-react";

import { VegetableArt } from "@/components/vegetable-art";
import { VegName } from "@/components/veg-name";
import { Button } from "@/components/ui/button";
import { formatQty, inr, maxBuyable, stepFor, unitTe, unitWord } from "@/lib/format";
import type { Vegetable } from "@/lib/types";

export function VegetableCard({
  vegetable,
  qty,
  onQty,
}: {
  vegetable: Vegetable;
  qty: number;
  onQty: (qty: number) => void;
}) {
  const step = stepFor(vegetable.unit);
  const max = maxBuyable(vegetable.unit, vegetable.quantity);
  const soldOut = max <= 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_10px_30px_rgba(28,36,22,0.05)] ring-1 ring-foreground/10">
      <div className="relative">
        <VegetableArt id={vegetable.id} className="h-36 w-full" />
        <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-ink">
          {unitWord(vegetable.unit, 1)} · {unitTe(vegetable.unit)}
        </span>
        {soldOut ? (
          <span className="absolute right-3 bottom-3 rounded-full bg-ink px-2.5 py-1 text-xs text-[#f6edd8]">
            Sold out
          </span>
        ) : vegetable.quantity <= step * 4 ? (
          <span className="absolute right-3 bottom-3 rounded-full bg-[#f6e3b0] px-2.5 py-1 text-xs text-ink">
            {formatQty(vegetable.quantity)} {unitWord(vegetable.unit, vegetable.quantity)} left
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <VegName
          nameTe={vegetable.nameTe}
          roman={vegetable.roman}
          nameEn={vegetable.nameEn}
          teClassName="text-[1.7rem]"
        />
        {vegetable.note ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{vegetable.note}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <p>
            <span className="font-heading text-2xl text-ink">{inr(vegetable.price)}</span>
            <span className="text-sm text-muted-foreground"> / {unitWord(vegetable.unit, 1)}</span>
          </p>
          {soldOut ? (
            <Button type="button" variant="secondary" className="h-11 px-4" disabled>
              Sold out
            </Button>
          ) : qty <= 0 ? (
            <Button
              type="button"
              className="h-11 rounded-full px-4"
              onClick={() => onQty(step)}
            >
              Add {step === 1 ? "a bunch" : "½ kg"}
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 bg-card"
                aria-label={`Remove ${step === 1 ? "a bunch" : "half a kilo"} of ${vegetable.nameEn}`}
                onClick={() => onQty(Math.round((qty - step) * 10) / 10)}
              >
                <Minus />
              </Button>
              <span className="min-w-14 text-center text-sm font-medium">
                {formatQty(qty)} {unitWord(vegetable.unit, qty)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 bg-card"
                aria-label={`Add ${step === 1 ? "a bunch" : "half a kilo"} of ${vegetable.nameEn}`}
                disabled={qty + step > max + 1e-9}
                onClick={() => onQty(Math.round((qty + step) * 10) / 10)}
              >
                <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
