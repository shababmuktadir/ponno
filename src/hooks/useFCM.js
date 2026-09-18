import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  registerFCMToken,
  isFCMSupported,
  getNotificationPermission,
  onForegroundMessage,
} from "@/services/firebase/fcmService";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errors";

const STORAGE_KEY = "pm.fcm.enabled";

export default function useFCM() {
  const { uid } = useAuth();
  const [supported] = useState(() => isFCMSupported());
  const [permission, setPermission] = useState(() =>
    getNotificationPermission()
  );
  const [registering, setRegistering] = useState(false);
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  /* -------- Foreground messages → toast -------- */
  useEffect(() => {
    if (!supported) return;
    let unsub = () => {};
    (async () => {
      try {
        const fn = await onForegroundMessage((payload) => {
          const title = payload?.notification?.title || "নোটিফিকেশন";
          const body = payload?.notification?.body || "";
          toast(body ? `${title}: ${body}` : title, {
            duration: 5000,
            icon: "🔔",
          });
        });
        if (typeof fn === "function") unsub = fn;
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[FCM foreground]", err);
      }
    })();
    return () => {
      try {
        unsub();
      } catch {}
    };
  }, [supported]);

  /* -------- Enable -------- */
  const enable = useCallback(async () => {
    if (!uid) {
      toast.error("লগইন করুন");
      return false;
    }
    if (!supported) {
      toast.error("এই ব্রাউজারে সাপোর্ট নেই");
      return false;
    }

    setRegistering(true);
    try {
      console.log("[useFCM] Starting registration for uid:", uid);
      const result = await registerFCMToken(uid);
      console.log("[useFCM] Success:", result);

      setEnabled(true);
      setPermission(getNotificationPermission());
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      toast.success("নোটিফিকেশন চালু হয়েছে");
      return true;
    } catch (err) {
      console.error("[useFCM] Error:", err);
      toast.error(err.message || getErrorMessage(err));
      return false;
    } finally {
      // ALWAYS reset loading state
      setRegistering(false);
    }
  }, [uid, supported]);

  /* -------- Disable -------- */
  const disable = useCallback(async () => {
    if (!uid) return;
    try {
      const { removeAllTokens } = await import(
        "@/services/firebase/fcmService"
      );
      await removeAllTokens(uid);
    } catch {}
    setEnabled(false);
    try {
      localStorage.setItem(STORAGE_KEY, "0");
    } catch {}
    toast.success("নোটিফিকেশন বন্ধ করা হয়েছে");
  }, [uid]);

  /* -------- Auto-restore on login -------- */
  useEffect(() => {
    if (!uid || !supported) return;
    if (!enabled) return;
    if (getNotificationPermission() !== "granted") return;

    let cancelled = false;
    (async () => {
      try {
        await registerFCMToken(uid);
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[FCM auto-restore]", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return {
    supported,
    permission,
    enabled,
    registering,
    enable,
    disable,
  };
}