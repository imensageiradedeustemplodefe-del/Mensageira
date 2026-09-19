"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import DailyVerse from "@/components/DailyVerse";
import { MediaPlayer } from "@/components/MediaPlayer";
import { HeroSection } from "@/components/home/HeroSection";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { ContactSection } from "@/components/home/ContactSection";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function HomePage() {
  const { toast } = useToast();
  const { loading: settingsLoading } = useSiteSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);
    setInstallable(false);

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      toast({ title: "App instalado!", description: "O app foi instalado com sucesso em seu dispositivo." });
    } else {
      setInstallable(true);
      setDeferredPrompt(promptEvent);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection installable={installable} onInstallClick={handleInstallClick} />

      <section className="py-12 bg-background" aria-labelledby="daily-verse-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="daily-verse-heading" className="sr-only">
            Palavra do Dia
          </h2>
          <DailyVerse />
        </div>
      </section>

      <section className="py-12 bg-accent/30" aria-labelledby="media-player-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="media-player-heading" className="sr-only">
            Player de Mídia
          </h2>
          <MediaPlayer />
        </div>
      </section>

      <UpcomingEvents loading={settingsLoading} />
      <ContactSection />
    </div>
  );
}
