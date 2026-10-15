"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-4xl">The stall hit a snag.</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <Button type="button" className="mt-6 h-11 rounded-full px-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
