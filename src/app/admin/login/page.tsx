import type { Metadata } from "next";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";

export const metadata: Metadata = { title: "Painel Administrativo", robots: { index: false } };

export default function Page() {
  return <AdminLoginPage />;
}
