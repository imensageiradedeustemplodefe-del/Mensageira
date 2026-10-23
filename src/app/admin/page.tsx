import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function Page() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  const { id, role, name, username } = session.user;
  return <AdminPanel user={{ id, role, name: name || username, username }} />;
}
