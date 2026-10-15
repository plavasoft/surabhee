"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/components/cart-provider";
import { cn } from "cn";

const links = [
  { href: "/", label: "Stall" },
  { href: "/cart", label: "Basket" },
  { href: "/inbox", label: "Messages" },
  { href: "/group", label: "Group" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { lines, ready } = useCart();
  const count = lines.length;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[#f7f1e6]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-leaf text-[#f6edd8]" aria-hidden>
            <svg viewBox="0 0 32 32" className="size-6">
              <path d="M16 26c0-9 7-14 12-15-3 9-7 15-12 15Z" fill="#f6edd8" />
              <path d="M16 26C16 16 8 10 4 9c4 9 8 15 12 17Z" fill="#e7c56a" />
            </svg>
          </span>
          <span>
            <span lang="te" className="font-telugu block text-lg leading-none text-ink">
              ఆంధ్ర తోట
            </span>
            <span className="text-xs tracking-wide text-muted-foreground">Andhra Thota</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-2.5 py-2 font-medium sm:px-3",
                  active ? "bg-leaf text-primary-foreground" : "text-ink hover:bg-secondary",
                )}
              >
                {link.label}
                {link.href === "/cart" && ready && count > 0 ? (
                  <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-[#e7c56a] px-1 text-xs text-ink">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
