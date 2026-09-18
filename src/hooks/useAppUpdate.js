import { useEffect, useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function useAppUpdate() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [updating, setUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [swOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL);
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) console.error("[SW]", error);
    },
  });

  useEffect(() => {
    setOfflineReady(swOfflineReady);
  }, [swOfflineReady]);

  const applyUpdate = useCallback(async () => {
    setUpdating(true);
    try {
      await updateServiceWorker(true);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      setUpdating(false);
    }
  }, [updateServiceWorker]);

  const dismiss = useCallback(() => setNeedRefresh(false), [setNeedRefresh]);

  return { needRefresh, offlineReady, updating, applyUpdate, dismiss };
}