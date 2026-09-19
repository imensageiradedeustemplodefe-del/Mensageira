"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { useCacheManager } from "@/hooks/useCacheManager";

export const UpdateNotification = () => {
  const { updateAvailable } = useServiceWorkerUpdate();
  const { clearAllCache } = useCacheManager();
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (updateAvailable) setIsVisible(true);
  }, [updateAvailable]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await clearAllCache();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border rounded-lg shadow-lg p-4 max-w-md mx-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Nova versão disponível!</h3>
            <p className="text-xs text-muted-foreground mb-3">Uma atualização está pronta para ser instalada.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={isUpdating} className="flex items-center gap-2">
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    Atualizar Agora
                  </>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)} disabled={isUpdating}>
                Depois
              </Button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            disabled={isUpdating}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
