import { Label } from "@/components/ui/label";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export const fieldClass = "h-11 bg-card px-3 text-base md:text-base";
