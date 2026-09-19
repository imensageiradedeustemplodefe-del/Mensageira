"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const ContactSection = () => {
  const { settings } = useSiteSettings();
  const address =
    settings.contact_address_full || settings.church_address || "R. Elias Biasi, 49 - Berger, Caçador - SC, 89500-000";

  return (
    <section className="py-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Venha nos Visitar</h2>
        <div className="flex items-center justify-center text-muted-foreground mb-6">
          <MapPin className="w-5 h-5 mr-2" />
          <span>{address}</span>
        </div>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Estamos de portas abertas para recebê-lo em nossa casa. Venha conhecer nossa comunidade e participar dos
          nossos cultos.
        </p>
        <Link href="/contato">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Entre em Contato
          </Button>
        </Link>
      </div>
    </section>
  );
};
