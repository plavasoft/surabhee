import type { Metadata } from "next";

import { GroupDesk } from "@/components/group-desk";

export const metadata: Metadata = { title: "Group" };

export default function Page() {
  return <GroupDesk />;
}
