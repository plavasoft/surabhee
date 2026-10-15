import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-4xl">That page is not on the stall.</h1>
      <p className="mt-2 text-muted-foreground">The vegetables are back on the front page.</p>
      <Link href="/" className={cn(buttonVariants({ className: "mt-6 h-11 rounded-full px-5" }))}>
        Back to the stall
      </Link>
    </div>
  );
}
