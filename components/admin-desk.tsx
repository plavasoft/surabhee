"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Field, fieldClass } from "@/components/field";
import { VegName } from "@/components/veg-name";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { formatPhone, formatQty, formatWhen, inr, STATUS_LABEL, unitWord } from "@/lib/format";
import type { AdminState, Group, Order, Unit, Vegetable } from "@/lib/types";
import { VPA_RE } from "@/lib/validate";

type Session = { authenticated: boolean; usingDefaultPassword: boolean };

const emptyDraft = {
  nameTe: "",
  nameEn: "",
  roman: "",
  unit: "kg" as Unit,
  group: "vegetable" as Group,
  price: "",
  quantity: "",
  note: "",
};

export function AdminDesk() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [desk, setDesk] = useState<AdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadSession() {
    const next = await api<Session>("/api/admin/session");
    setSession(next);
    if (next.authenticated) {
      setDesk(await api<AdminState>("/api/admin/dashboard"));
    }
  }

  useEffect(() => {
    let cancelled = false;
    api<Session>("/api/admin/session")
      .then((next) => {
        if (cancelled) return null;
        setSession(next);
        if (!next.authenticated) return null;
        return api<AdminState>("/api/admin/dashboard");
      })
      .then((nextDesk) => {
        if (cancelled || !nextDesk) return;
        setDesk(nextDesk);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "The desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setLoginError(null);
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await loadSession();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    setDesk(null);
    setSession({ authenticated: false, usingDefaultPassword: session?.usingDefaultPassword ?? true });
  }

  if (!session && !error) {
    return <div className="mx-auto mt-8 h-64 max-w-lg animate-pulse rounded-2xl bg-card" />;
  }

  if (error && !session?.authenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p>{error}</p>
      </div>
    );
  }

  if (session?.authenticated && !desk && error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p>{error}</p>
        <Button type="button" className="mt-4 h-11" onClick={() => void loadSession()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!session?.authenticated) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <p className="text-xs tracking-[0.16em] text-leaf uppercase">Farm desk</p>
        <h1 className="mt-2 text-4xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update prices, quantities, and the vegetable list. Orders land here with a phone number
          and address.
        </p>
        <form onSubmit={login} className="mt-6 grid gap-4">
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className={fieldClass}
              required
            />
          </Field>
          {session?.usingDefaultPassword ? (
            <p className="text-sm text-muted-foreground">
              Starter password: <span className="font-mono text-ink">rythu-thota</span>. Set
              ADMIN_PASSWORD before sharing the site.
            </p>
          ) : null}
          {loginError ? (
            <p className="text-sm text-chili" role="alert">
              {loginError}
            </p>
          ) : null}
          <Button type="submit" className="h-11 rounded-full" disabled={pending}>
            {pending ? "Checking…" : "Open the desk"}
          </Button>
        </form>
      </div>
    );
  }

  if (!desk) {
    return <div className="mx-auto mt-8 h-64 max-w-5xl animate-pulse rounded-2xl bg-card" />;
  }

  return (
    <Desk
      desk={desk}
      setDesk={setDesk}
      onLogout={() => void logout()}
    />
  );
}

function Desk({
  desk,
  setDesk,
  onLogout,
}: {
  desk: AdminState;
  setDesk: (state: AdminState) => void;
  onLogout: () => void;
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState<Vegetable | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);

  const orders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return desk.orders;
    return desk.orders.filter((order) =>
      `${order.id} ${order.phone} ${order.name}`.toLowerCase().includes(needle),
    );
  }, [desk.orders, query]);

  async function run(task: () => Promise<AdminState>, success: string) {
    setPending(true);
    try {
      const next = await task();
      setDesk(next);
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That change did not save.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-leaf uppercase">Farm desk</p>
          <h1 className="mt-1 text-4xl">Stall, prices, orders</h1>
        </div>
        <Button type="button" variant="outline" className="h-11 bg-card" onClick={onLogout}>
          Sign out
        </Button>
      </div>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl">UPI ID</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers pay this ID from GPay, PhonePe, Paytm, or BHIM. Use the ID from your own
          account. Leave it blank until you are ready to take money.
        </p>
        {!VPA_RE.test(desk.settings.vpa) ? (
          <p className="mt-3 rounded-xl bg-[#f6e3b0] px-3 py-2 text-sm">
            Payment is waiting on a UPI ID. Orders can still be placed, and the pay screen asks
            the customer to come back after you save one.
          </p>
        ) : null}
        <UpiForm
          key={`${desk.settings.vpa}|${desk.settings.payeeName}`}
          vpa={desk.settings.vpa}
          payeeName={desk.settings.payeeName}
          pending={pending}
          onSave={(nextVpa, nextPayee) =>
            run(
              () =>
                api<AdminState>("/api/admin/settings", {
                  method: "PUT",
                  body: JSON.stringify({ vpa: nextVpa, payeeName: nextPayee }),
                }),
              "UPI details saved.",
            )
          }
        />
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl">Add a vegetable</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const next = await api<AdminState>("/api/admin/vegetables", {
                method: "POST",
                body: JSON.stringify({
                  ...draft,
                  price: draft.price,
                  quantity: draft.quantity,
                }),
              });
              setDraft(emptyDraft);
              return next;
            }, "Vegetable added to the stall.");
          }}
        >
          <Field label="Telugu name">
            <Input
              value={draft.nameTe}
              onChange={(event) => setDraft({ ...draft, nameTe: event.target.value })}
              className={`${fieldClass} font-telugu`}
              placeholder="బెండకాయ"
              required
            />
          </Field>
          <Field label="English name">
            <Input
              value={draft.nameEn}
              onChange={(event) => setDraft({ ...draft, nameEn: event.target.value })}
              className={fieldClass}
              placeholder="Okra"
              required
            />
          </Field>
          <Field label="Spoken name" hint="How customers say it, such as Benda kaya.">
            <Input
              value={draft.roman}
              onChange={(event) => setDraft({ ...draft, roman: event.target.value })}
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Short note">
            <Input
              value={draft.note}
              onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Sold by">
            <Select
              value={draft.unit}
              onValueChange={(value) => setDraft({ ...draft, unit: (value ?? "kg") as Unit })}
            >
              <SelectTrigger className="h-11 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogram · కిలో</SelectItem>
                <SelectItem value="bunch">Bunch · కట్ట</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Group">
            <Select
              value={draft.group}
              onValueChange={(value) =>
                setDraft({ ...draft, group: (value ?? "vegetable") as Group })
              }
            >
              <SelectTrigger className="h-11 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetable">Vegetables</SelectItem>
                <SelectItem value="leafy">Greens</SelectItem>
                <SelectItem value="chilli">Chillies</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Price (₹)">
            <Input
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              inputMode="decimal"
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Quantity on the stall">
            <Input
              value={draft.quantity}
              onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
              inputMode="decimal"
              className={fieldClass}
              required
            />
          </Field>
          <Button type="submit" className="h-11 sm:col-span-2 sm:w-fit" disabled={pending}>
            Add to the stall
          </Button>
        </form>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl">On the stall</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quantity is what shoppers can still buy. An order already placed has reduced it.
          </p>
        </div>
        {desk.vegetables.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 text-sm ring-1 ring-border">
            The stall is empty. Add the first vegetable above.
          </p>
        ) : (
          desk.vegetables.map((vegetable) => (
            <StockEditor
              key={`${vegetable.id}:${vegetable.price}:${vegetable.quantity}:${vegetable.nameTe}:${vegetable.nameEn}:${vegetable.roman}:${vegetable.unit}:${vegetable.group}:${vegetable.note}`}
              vegetable={vegetable}
              pending={pending}
              onRemove={() => setRemoving(vegetable)}
              onSave={(body) =>
                run(
                  () =>
                    api<AdminState>(`/api/admin/vegetables/${vegetable.id}`, {
                      method: "PATCH",
                      body: JSON.stringify(body),
                    }),
                  "Saved.",
                )
              }
            />
          ))
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl">Orders</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Match the UPI reference in your app, then confirm. Cancelling puts the vegetables
              back on the stall. Refund a payment from your UPI app yourself.
            </p>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Phone or order id"
            aria-label="Search orders"
            className="h-11 bg-card sm:max-w-xs"
          />
        </div>
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 text-sm ring-1 ring-border">
            {desk.orders.length === 0
              ? "No orders yet. A phone number and address will show up here after checkout."
              : "No order matches that search."}
          </p>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm">
                    {order.id}
                    {order.source === "whatsapp" || order.source === "sms" ? (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 font-sans text-xs">
                        {order.source === "whatsapp" ? "WhatsApp" : "SMS"}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatWhen(order.createdAt)}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="mt-3 font-medium">{order.name}</p>
              <a href={`tel:+91${order.phone}`} className="font-heading text-3xl text-leaf">
                {formatPhone(order.phone)}
              </a>
              <p className="mt-2 text-sm leading-6">
                {order.address}
                {order.landmark ? `, ${order.landmark}` : ""}
                <br />
                {order.district} {order.pincode}
              </p>
              <ul className="mt-4 grid gap-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.vegetableId} className="flex justify-between gap-3">
                    <span>
                      <span lang="te" className="font-telugu">
                        {item.nameTe}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {item.roman} · {item.nameEn} · {formatQty(item.qty)}{" "}
                        {unitWord(item.unit, item.qty)}
                      </span>
                    </span>
                    <span>{inr(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-heading text-2xl">{inr(order.total)}</p>
              <p className="mt-1 text-sm">
                UPI reference:{" "}
                <span className="font-mono">{order.utr || "not entered yet"}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status !== "confirmed" && order.status !== "cancelled" ? (
                  <Button
                    type="button"
                    className="h-11"
                    disabled={pending}
                    onClick={() =>
                      void run(
                        () =>
                          api<AdminState>(`/api/admin/orders/${order.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ status: "confirmed" }),
                          }),
                        "Order confirmed.",
                      )
                    }
                  >
                    Mark confirmed
                  </Button>
                ) : null}
                {order.status !== "cancelled" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={pending}
                    onClick={() => setCancelling(order)}
                  >
                    Cancel and return stock
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <Dialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove <span lang="te" className="font-telugu">{removing?.nameTe}</span>?
            </DialogTitle>
            <DialogDescription>
              {removing
                ? `${removing.roman} · ${removing.nameEn} leaves the stall. Orders already placed keep the name on the slip.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)}>
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!removing) return;
                const id = removing.id;
                void run(
                  () => api<AdminState>(`/api/admin/vegetables/${id}`, { method: "DELETE" }),
                  "Removed from the stall.",
                ).then((ok) => {
                  if (ok) setRemoving(null);
                });
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {cancelling?.id}?</DialogTitle>
            <DialogDescription>
              The vegetables go back on the stall. If the UPI payment already arrived, send the
              refund from your own app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelling(null)}>
              Keep the order
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!cancelling) return;
                const id = cancelling.id;
                void run(
                  () =>
                    api<AdminState>(`/api/admin/orders/${id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "cancelled" }),
                    }),
                  "Order cancelled and stock returned.",
                ).then((ok) => {
                  if (ok) setCancelling(null);
                });
              }}
            >
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UpiForm({
  vpa: initialVpa,
  payeeName: initialPayee,
  pending,
  onSave,
}: {
  vpa: string;
  payeeName: string;
  pending: boolean;
  onSave: (vpa: string, payeeName: string) => Promise<boolean>;
}) {
  const [vpa, setVpa] = useState(initialVpa);
  const [payeeName, setPayeeName] = useState(initialPayee);

  return (
    <form
      className="mt-4 grid gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(vpa, payeeName);
      }}
    >
      <Field label="UPI ID" hint="Example shape: yourname@okaxis">
        <Input value={vpa} onChange={(event) => setVpa(event.target.value)} className={fieldClass} />
      </Field>
      <Field label="Name shown in the UPI app">
        <Input
          value={payeeName}
          onChange={(event) => setPayeeName(event.target.value)}
          className={fieldClass}
        />
      </Field>
      <Button type="submit" className="h-11 sm:col-span-2 sm:w-fit" disabled={pending}>
        Save UPI details
      </Button>
    </form>
  );
}

function StockEditor({
  vegetable,
  pending,
  onSave,
  onRemove,
}: {
  vegetable: Vegetable;
  pending: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
  onRemove: () => void;
}) {
  const [price, setPrice] = useState(String(vegetable.price));
  const [quantity, setQuantity] = useState(String(vegetable.quantity));
  const [nameTe, setNameTe] = useState(vegetable.nameTe);
  const [nameEn, setNameEn] = useState(vegetable.nameEn);
  const [roman, setRoman] = useState(vegetable.roman);
  const [note, setNote] = useState(vegetable.note);
  const [unit, setUnit] = useState<Unit>(vegetable.unit);
  const [group, setGroup] = useState<Group>(vegetable.group);

  return (
    <article className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <VegName
          nameTe={vegetable.nameTe}
          roman={vegetable.roman}
          nameEn={vegetable.nameEn}
          teClassName="text-2xl"
        />
        <p className="text-sm text-muted-foreground">
          {formatQty(vegetable.quantity)} {unitWord(vegetable.unit, vegetable.quantity)} at{" "}
          {inr(vegetable.price)}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Field label="Price ₹">
          <Input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            className={fieldClass}
          />
        </Field>
        <Field label={`Available (${unitWord(vegetable.unit)})`}>
          <Input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            className={fieldClass}
          />
        </Field>
        <Button
          type="button"
          className="h-11"
          disabled={pending}
          onClick={() => void onSave({ price, quantity })}
        >
          Save price and quantity
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium">Edit names and note</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Telugu name">
            <Input value={nameTe} onChange={(event) => setNameTe(event.target.value)} className={`${fieldClass} font-telugu`} />
          </Field>
          <Field label="English name">
            <Input value={nameEn} onChange={(event) => setNameEn(event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Spoken name">
            <Input value={roman} onChange={(event) => setRoman(event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Note">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="bg-card" />
          </Field>
          <Field label="Sold by">
            <Select value={unit} onValueChange={(value) => setUnit((value ?? unit) as Unit)}>
              <SelectTrigger className="h-11 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogram</SelectItem>
                <SelectItem value="bunch">Bunch</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Group">
            <Select value={group} onValueChange={(value) => setGroup((value ?? group) as Group)}>
              <SelectTrigger className="h-11 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetable">Vegetables</SelectItem>
                <SelectItem value="leafy">Greens</SelectItem>
                <SelectItem value="chilli">Chillies</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button
            type="button"
            variant="secondary"
            className="h-11 sm:col-span-2 sm:w-fit"
            disabled={pending}
            onClick={() => void onSave({ nameTe, nameEn, roman, note, unit, group })}
          >
            Save names
          </Button>
        </div>
      </details>
    </article>
  );
}
