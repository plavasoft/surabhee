import type { Metadata } from "next";

import { AdminDesk } from "@/components/admin-desk";

export const metadata: Metadata = { title: "Admin" };

export default function Page() {
  return <AdminDesk />;
}
