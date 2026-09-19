import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function Page() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminPanel />;
}
