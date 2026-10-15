"use client";

import { useEffect, useState } from "react";

import { DeskGate } from "@/components/desk-gate";
import { Field, fieldClass } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { formatWhen } from "@/lib/format";
import type { GroupDecision, GroupEvent } from "@/lib/types";

type Desk = {
  today: { day: string; thursday: boolean; label: string };
  events: GroupEvent[];
  adsToday: number;
};

type GroupResponse = {
  event: GroupEvent;
  decision: GroupDecision;
  reply: string;
  today: Desk["today"];
};

const decisionLabel: Record<GroupDecision, string> = {
  allow_chat: "Chat allowed",
  allow_ad: "Advertisement kept",
  warn_not_thursday: "Not Thursday",
  warn_repeat: "Repeat blocked",
  block_abuse: "Abusive message blocked",
};

const samples = [
  {
    label: "Morning chat",
    sender: "Lakshmi",
    text: "Good morning. Gongura pachadi recipe, anyone?",
    asThursday: false,
  },
  {
    label: "Ad today",
    sender: "Ravi Traders",
    text: "Fresh tomatoes ₹30/kg. Offer today. Call 9876543210. https://example.com/shop",
    asThursday: false,
  },
  {
    label: "Thursday ad",
    sender: "Ravi Traders",
    text: "Thursday special: rice bags ₹1400. Wholesale offer, Vijayawada.",
    asThursday: true,
  },
  {
    label: "Obscene post",
    sender: "Unknown",
    text: "watch this porn video",
    asThursday: false,
  },
] as const;

export function GroupDesk() {
  return (
    <DeskGate
      kicker="Group agent"
      title="Group desk"
      lede="The agent watches a WhatsApp group for business posts and messages that should not stay up."
    >
      <GroupBody />
    </DeskGate>
  );
}

function GroupBody() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sender, setSender] = useState("Ravi Traders");
  const [text, setText] = useState<string>(samples[1].text);
  const [asThursday, setAsThursday] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [decision, setDecision] = useState<GroupDecision | null>(null);

  function load() {
    return api<Desk>("/api/group").then((next) => {
      setDesk(next);
      setError(null);
    });
  }

  useEffect(() => {
    let cancelled = false;
    api<Desk>("/api/group")
      .then((next) => {
        if (!cancelled) setDesk(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "The group desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!desk && !error) {
    return <div className="mx-auto mt-8 h-64 max-w-3xl animate-pulse rounded-2xl bg-card" />;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section>
        <p className="text-xs tracking-[0.16em] text-leaf uppercase">Group agent</p>
        <h1 className="mt-2 font-heading text-4xl text-ink">Group desk</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Three rules, checked in India time. Business advertisements stay up only on Thursday.
          The same member, or the same advertisement, cannot go up twice that day. Abusive,
          obscene, and pornographic messages are refused every day.
        </p>
        {desk ? (
          <p className="mt-4 rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-border">
            In India it is <span className="font-medium">{desk.today.label}</span>.{" "}
            {desk.today.thursday
              ? "Thursday is open for one business post per member."
              : "Business posts wait until Thursday."}{" "}
            {desk.adsToday} live advertisement{desk.adsToday === 1 ? "" : "s"} recorded today.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {samples.map((sample) => (
            <Button
              key={sample.label}
              type="button"
              variant="secondary"
              className="h-9"
              onClick={() => {
                setSender(sample.sender);
                setText(sample.text);
                setAsThursday(sample.asThursday);
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
            api<GroupResponse>("/api/group", {
              method: "POST",
              body: JSON.stringify({
                groupId: "andhra-thota-neighbours",
                sender,
                text,
                asThursday,
              }),
              signal: AbortSignal.timeout(20000),
            })
              .then((result) => {
                setReply(result.reply);
                setDecision(result.decision);
                return load();
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "The group message could not be judged.");
              })
              .finally(() => setPending(false));
          }}
        >
          <Field label="Member name">
            <Input value={sender} onChange={(event) => setSender(event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Group message">
            <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-32 bg-card text-base" />
          </Field>
          <label className="flex items-start gap-2 text-sm leading-5">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-leaf"
              checked={asThursday}
              onChange={(event) => setAsThursday(event.target.checked)}
            />
            <span>Rehearse this as Thursday. The rehearsal does not use today’s advertisement list.</span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-fit" disabled={pending}>
            {pending ? "Checking…" : "Run the group agent"}
          </Button>
        </form>
        {decision ? (
          <div className="mt-4 rounded-2xl bg-accent/60 p-4 text-sm leading-6 whitespace-pre-wrap">
            <p className="text-xs tracking-[0.14em] text-leaf uppercase">{decisionLabel[decision]}</p>
            <p className="mt-2">
              {reply ||
                (decision === "allow_ad"
                  ? "The advertisement can stay. Nothing extra is posted in the group."
                  : "Ordinary chat. The agent stays quiet.")}
            </p>
            {decision === "block_abuse" ? (
              <p className="mt-3">
                WhatsApp does not let this number delete another member’s message. The warning is
                ready for a group admin to send, and a person with group admin rights in the
                WhatsApp app has to remove the post.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
      <section className="grid content-start gap-3">
        <h2 className="font-heading text-2xl text-ink">Decisions</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Pictures are not judged unless a moderation key is added later. Worded abuse is blocked
          from the text itself.
        </p>
        {desk && desk.events.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 text-sm ring-1 ring-border">No group messages yet.</p>
        ) : null}
        {desk?.events.map((event) => (
          <article key={event.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{event.sender}</p>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{decisionLabel[event.decision]}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatWhen(event.at)}
              {event.preview ? " · Thursday rehearsal" : ""}
            </p>
            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{event.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
