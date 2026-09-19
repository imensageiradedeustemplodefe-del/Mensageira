"use client";

import Link from "next/link";
import { Youtube, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  installable: boolean;
  onInstallClick: () => void;
}

export const HeroSection = ({ installable, onInstallClick }: HeroSectionProps) => {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-peaceful-blue/20 py-16 sm:py-24">
      <div className="absolute inset-0 bg-gradient-to-r from-spiritual-glow/5 to-transparent"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Bem-vindos à
            <span className="block text-primary mt-2">Mensageira de Deus</span>
            <span className="block text-lg sm:text-xl font-normal text-muted-foreground mt-2">Templo de Fé</span>
            <span className="block text-base sm:text-lg font-normal text-muted-foreground mt-1">
              Uma igreja comprometida com a Palavra de Deus
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Venha fazer parte da nossa família de fé. Aqui você encontrará acolhimento, crescimento espiritual e uma
            comunidade que se importa com você.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-6 px-4">
            <Link href="/live" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                <Youtube className="w-5 h-5 mr-2" />
                Assistir ao Vivo
              </Button>
            </Link>
            {installable && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10"
                onClick={onInstallClick}
              >
                <Download className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Instalar App</span>
                <span className="sm:hidden">Instalar</span>
              </Button>
            )}
            <Link href="/eventos" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Ver Programação</span>
                <span className="sm:hidden">Programação</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
