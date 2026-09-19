"use client";

import { useState, type ReactNode } from "react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";
import { UpdateNotification } from "@/components/UpdateNotification";
import { SplashScreen } from "@/components/SplashScreen";
import { PushPrompt } from "@/components/PushPrompt";
import { useIsMobile } from "@/hooks/use-mobile";

// Public site chrome: header, bottom nav (mobile), footer (desktop), floating player, splash.
export function PublicShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="min-h-screen flex flex-col">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Navigation />
      <main id="main-content" role="main" className={`flex-1 ${isMobile ? "pb-20" : ""}`}>
        {children}
      </main>
      {!isMobile && <Footer />}
      {isMobile && <MobileBottomNav />}
      <GlobalAudioPlayer />
      <UpdateNotification />
      {!showSplash && <PushPrompt />}
    </div>
  );
}
