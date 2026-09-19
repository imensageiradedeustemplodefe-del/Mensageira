"use client";

import { useEffect, useState } from "react";

export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") setUpdateAvailable(true);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setUpdateAvailable(true);
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    });

    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => registration.update());
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  const forceUpdate = () => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    });
  };

  return { updateAvailable, forceUpdate };
};
