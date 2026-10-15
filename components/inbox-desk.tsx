"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DeskGate } from "@/components/desk-gate";
import { Field, fieldClass } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { formatPhone, formatWhen } from "@/lib/format";
import type { InboxEvent, InboxOutcome, OrderDraft } from "@/lib/types";

type Desk = {
  inbox: InboxEvent[];
  drafts: OrderDraft[];
  voiceReady: boolean;
  whatsappReady: boolean;
  smsReady: boolean;
};

type IntakeResponse = {
  reply: string;
  outcome: InboxOutcome;
  orderId: string | null;
};

const samples = [
  {
    label: "Telugu text",
    channel: "whatsapp",
    kind: "text",
    from: "9876500101",
    name: "లక్ష్మి",
    text: "2 కిలోల బెండకాయ, 1 కట్ట గోంగూర. నా పేరు లక్ష్మి. చిరునామా: 4-12 గాంధీ వీధి, గుంటూరు 522001",
  },
  {
    label: "English, address later",
    channel: "whatsapp",
    kind: "text",
    from: "9876500102",
    name: "Ravi",
    text: "Please send 1 kg vankaya and 2 bunches kothi mera",
  },
  {
    label: "Hindi voice",
    channel: "whatsapp",
    kind: "voice",
    from: "9876500103",
    name: "Suresh",
    text: "2 kilo bhindi aur 1 guccha dhaniya chahiye. Mera naam Suresh. Pata: 18 Benz Circle, Vijayawada 520010",
  },
  {
    label: "Price question",
    channel: "sms",
    kind: "sms",
    from: "9876500104",
    name: "Anitha",
    text: "Gongura entha? Mirapa kayalu rate?",
  },
] as const;

const outcomeLabel: Record<InboxOutcome, string> = {
  order: "Order saved",
  draft: "Waiting for address",
  question: "Price answer",
  menu: "Stall list",
  ignored: "Not an order",
  need_voice_text: "Voice not read",
  rejected: "Rejected",
};

export function InboxDesk() {
  return (
    <DeskGate
      kicker="Order agent"
      title="Messages"
      lede="WhatsApp text, WhatsApp voice, and SMS land here. A vegetable order becomes a stall order once the name, address, district, and PIN code are in the thread."
    >
      <InboxBody />
    </DeskGate>
  );
}

function InboxBody() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [channel, setChannel] = useState<(typeof samples)[number]["channel"]>("whatsapp");
  const [kind, setKind] = useState<(typeof samples)[number]["kind"]>("text");
  const [from, setFrom] = useState("9876500101");
  const [name, setName] = useState("లక్ష్మి");
  const [text, setText] = useState<string>(samples[0].text);
  const [reply, setReply] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  function load() {
    return api<Desk>("/api/inbox")
      .then((next) => {
        setDesk(next);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "The message desk could not be opened.");
      });
  }

  useEffect(() => {
    let cancelled = false;
    api<Desk>("/api/inbox")
      .then((next) => {
        if (!cancelled) setDesk(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "The message desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!desk && !error) {
    return <div className="mx-auto mt-8 h-64 max-w-3xl animate-pulse rounded-2xl bg-card" />;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-xs tracking-[0.16em] text-leaf uppercase">Order agent</p>
        <h1 className="mt-2 font-heading text-4xl text-ink">Messages</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Telugu and English text, and Telugu, English, or Hindi voice, are read as vegetable
          orders. Try a sample below. Live WhatsApp and SMS connect when the farm adds its own
          keys. Voice notes are typed through until a transcription key is set
          {desk?.voiceReady ? ", and that key is set on this server." : "."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {samples.map((sample) => (
            <Button
              key={sample.label}
              type="button"
              variant="secondary"
              className="h-9"
              onClick={() => {
                setChannel(sample.channel);
                setKind(sample.kind);
                setFrom(sample.from);
                setName(sample.name);
                setText(sample.text);
              }}
            >
              {sample.label}
            </Button>
          ))}
        </div>
        <form
          className="mt-5 grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            api<IntakeResponse>("/api/inbox", {
              method: "POST",
              body: JSON.stringify({
                channel,
                kind,
                from,
                name,
                text: kind === "voice" ? "" : text,
                transcript: kind === "voice" ? text : "",
              }),
              signal: AbortSignal.timeout(20000),
            })
              .then((result) => {
                setReply(result.reply);
                setOrderId(result.orderId);
                return load();
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "The message could not be read.");
              })
              .finally(() => setPending(false));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Channel">
              <select
                className={fieldClass}
                value={channel}
                onChange={(event) => {
                  const next = event.target.value === "sms" ? "sms" : "whatsapp";
                  setChannel(next);
                  if (next === "sms") setKind("sms");
                  else if (kind === "sms") setKind("text");
                }}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </Field>
            <Field label="Kind">
              <select
                className={fieldClass}
                value={kind}
                onChange={(event) => {
                  const next = event.target.value;
                  setKind(next === "voice" ? "voice" : next === "sms" ? "sms" : "text");
                }}
              >
                {channel === "whatsapp" ? <option value="text">Text</option> : null}
                {channel === "whatsapp" ? <option value="voice">Voice</option> : null}
                {channel === "sms" ? <option value="sms">SMS</option> : null}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number">
              <Input value={from} onChange={(event) => setFrom(event.target.value)} className={fieldClass} inputMode="tel" />
            </Field>
            <Field label="WhatsApp or SMS name">
              <Input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
            </Field>
          </div>
          <Field
            label={kind === "voice" ? "What the voice note said" : "Message"}
            hint={
              kind === "voice"
                ? "Telugu, English, or Hindi. A live voice note is transcribed when OPENAI_API_KEY is set. This box is the same text the agent would hear."
                : "Telugu or English."
            }
          >
            <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-32 bg-card text-base" />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-fit" disabled={pending}>
            {pending ? "Reading…" : "Run the order agent"}
          </Button>
        </form>
        {reply ? (
          <div className="mt-4 rounded-2xl bg-accent/60 p-4 text-sm leading-6 whitespace-pre-wrap">
            <p className="text-xs tracking-[0.14em] text-leaf uppercase">Reply</p>
            <p className="mt-2">{reply}</p>
            {orderId ? (
              <p className="mt-3">
                <Link href={`/pay/${orderId}`} className="font-medium text-leaf underline">
                  Open the UPI page for {orderId}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
      <section className="grid content-start gap-3">
        <h2 className="font-heading text-2xl text-ink">Recent messages</h2>
        {desk && desk.drafts.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {desk.drafts.length} open draft{desk.drafts.length === 1 ? "" : "s"} waiting for a name or address.
          </p>
        ) : null}
        {desk && desk.inbox.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 text-sm ring-1 ring-border">
            No messages yet. A WhatsApp or SMS order will show up here, and on the admin desk once the address is complete.
          </p>
        ) : null}
        {desk?.inbox.map((event) => (
          <article key={event.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {event.channel === "sms" ? "SMS" : "WhatsApp"} · {event.kind}
              </p>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{outcomeLabel[event.outcome]}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatWhen(event.at)} · {event.from.length === 10 ? formatPhone(event.from) : event.from}
              {event.name ? ` · ${event.name}` : ""}
            </p>
            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{event.text || "Voice note without words"}</p>
            {event.orderId ? (
              <Link href={`/admin`} className="mt-2 inline-block text-sm font-medium text-leaf">
                Order {event.orderId} is on the admin desk
              </Link>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
