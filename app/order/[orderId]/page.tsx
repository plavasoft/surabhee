import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderReceipt } from "@/components/order-receipt";

export const metadata: Metadata = { title: "Order" };

async function ReceiptScreen({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderReceipt orderId={orderId} />;
}

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense
      fallback={<div className="mx-auto mt-8 h-72 max-w-3xl animate-pulse rounded-2xl bg-card" />}
    >
      <ReceiptScreen params={params} />
    </Suspense>
  );
}
