import { useEffect, useState, useCallback, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
const OFFLINE_TOAST_DURATION = 3000; // 3 seconds auto-hide

export default function useAppUpdate() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const offlineTimerRef = useRef(null);

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

  /* -------- Offline ready: show then auto-hide -------- */
  useEffect(() => {
    if (swOfflineReady) {
      setOfflineReady(true);

      // Auto-hide after 3 seconds
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => {
        setOfflineReady(false);
      }, OFFLINE_TOAST_DURATION);
    }
    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [swOfflineReady]);

  /* -------- Apply update -------- */
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