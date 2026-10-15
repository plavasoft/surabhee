import type { Metadata } from "next";
import { Suspense } from "react";

import { PayPanel } from "@/components/pay-panel";

export const metadata: Metadata = { title: "Pay with UPI" };

async function PayScreen({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <PayPanel orderId={orderId} />;
}

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense
      fallback={<div className="mx-auto mt-8 h-80 max-w-5xl animate-pulse rounded-2xl bg-card" />}
    >
      <PayScreen params={params} />
    </Suspense>
  );
}
