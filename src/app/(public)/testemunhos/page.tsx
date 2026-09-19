import type { Metadata } from "next";
import { TestimoniesPage } from "@/components/pages/TestimoniesPage";

export const metadata: Metadata = { title: "Testemunhos", description: "Veja como Deus tem transformado vidas em nossa comunidade." };

export default function Page() {
  return <TestimoniesPage />;
}
