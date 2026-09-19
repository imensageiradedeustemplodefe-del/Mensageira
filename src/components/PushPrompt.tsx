"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const DISMISS_KEY = "push_prompt_dismissed_at";
const DISMISS_DAYS = 7;
const SHOW_AFTER_MS = 4000;

// Convite discreto para ativar notificações push (aparece uma vez; se recusado, volta em 7 dias).
export function PushPrompt() {
  const { isSupported, isEnabled, permission, ready, busy, subscribe } = usePushSubscription();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready || !isSupported || isEnabled || permission !== "default") return;
    try {
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [ready, isSupported, isEnabled, permission]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const enable = async () => {
    const ok = await subscribe();
    if (ok) setVisible(false);
    else dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card border border-primary/30 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <Image src="/icons/notification-192.png" alt="" width={44} height={44} className="w-11 h-11 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Receba as novidades da igreja</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Palavra do dia, cultos ao vivo, eventos e fotos — mesmo com o app fechado.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={enable} disabled={busy} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {busy ? "Ativando..." : "Ativar notificações"}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss} disabled={busy}>
                Agora não
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground min-w-0 min-h-0 h-8 w-8 -mt-1 -mr-1 rounded-md"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
