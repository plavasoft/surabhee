import type { Metadata } from "next";

import { BasketView } from "@/components/basket-view";

export const metadata: Metadata = { title: "Basket" };

export default function Page() {
  return <BasketView />;
}
