export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-[1.4fr_1fr]">
        <p>
          <span lang="te" className="font-telugu text-base text-ink">
            ఆంధ్ర తోట
          </span>{" "}
          sells organically grown vegetables for kitchens across Andhra Pradesh. Benda kaya,
          donda kaya, vankaya, chikkudu kaya, kothi mera, thota kura, gongura, mirapa kayalu,
          sora kaya, potla kaya, and beera kaya start on the stall. The admin desk can change
          the list.
        </p>
        <p>
          Pay in your own UPI app. WhatsApp and SMS orders use the same book. The group desk
          keeps business posts to Thursday and refuses abusive messages.
        </p>
      </div>
    </footer>
  );
}
