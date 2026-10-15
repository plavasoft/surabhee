"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Field, fieldClass } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

type Session = { authenticated: boolean; usingDefaultPassword: boolean };

export function DeskGate({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Session>("/api/admin/session")
      .then((next) => {
        if (!cancelled) setSession(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "The desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session && !error) {
    return <div className="mx-auto mt-8 h-64 max-w-lg animate-pulse rounded-2xl bg-card" />;
  }

  if (!session?.authenticated) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <p className="text-xs tracking-[0.16em] text-leaf uppercase">{kicker}</p>
        <h1 className="mt-2 font-heading text-4xl text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{lede}</p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            api<Session>("/api/admin/login", {
              method: "POST",
              body: JSON.stringify({ password }),
            })
              .then(() => {
                setSession({ authenticated: true, usingDefaultPassword: session?.usingDefaultPassword ?? true });
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "That password was not recognised.");
              })
              .finally(() => setPending(false));
          }}
        >
          <Field label="Farm desk password" hint={session?.usingDefaultPassword ? "The starter password is rythu-thota." : undefined}>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
              autoComplete="current-password"
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-fit" disabled={pending}>
            Sign in
          </Button>
        </form>
      </div>
    );
  }

  return children;
}
