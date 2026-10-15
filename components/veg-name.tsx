import { cn } from "cn";

export function VegName({
  nameTe,
  roman,
  nameEn,
  teClassName,
  className,
}: {
  nameTe: string;
  roman: string;
  nameEn: string;
  teClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("block", className)}>
      <span lang="te" className={cn("font-telugu block leading-tight", teClassName)}>
        {nameTe}
      </span>
      <span className="mt-1 block text-sm text-muted-foreground">
        {roman} · {nameEn}
      </span>
    </span>
  );
}
