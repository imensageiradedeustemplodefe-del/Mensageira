"use client";

import { useCallback } from "react";

export const useCacheManager = () => {
  const clearAllCache = useCallback(async () => {
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
      }
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    } finally {
      window.location.reload();
    }
  }, []);

  return { clearAllCache };
};
