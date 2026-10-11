"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/usePushSubscription";

/** Convite para ativar as notificações (o site avisa a cada álbum novo). Some quando já estão ativas ou não há suporte. */
export function NotifyNewPhotos({ className = "" }: { className?: string }) {
  const { isSupported, isEnabled, permission, ready, busy, subscribe } = usePushSubscription();
  if (!ready || !isSupported || isEnabled || permission === "denied") return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center sm:text-left ${className}`}>
      <Bell className="w-6 h-6 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">Quer saber quando sair fotos novas?</p>
        <p className="text-xs text-muted-foreground">Ative as notificações e receba um aviso a cada álbum novo na galeria.</p>
      </div>
      <Button size="sm" onClick={subscribe} disabled={busy} className="w-full sm:w-auto">
        {busy ? "Ativando..." : "Ativar notificações"}
      </Button>
    </div>
  );
}
