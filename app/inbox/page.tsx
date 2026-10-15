import type { Metadata } from "next";

import { InboxDesk } from "@/components/inbox-desk";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <InboxDesk />;
}
