"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } } })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="mensageira-theme">
          <TooltipProvider>
            <NotificationProvider>
              <AudioProvider>
                <Toaster />
                <Sonner />
                <ServiceWorkerRegister />
                {children}
              </AudioProvider>
            </NotificationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
