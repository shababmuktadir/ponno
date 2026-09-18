import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import {
  addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp,
  query, where,
} from "firebase/firestore";
import { app, db } from "@/config/firebase";

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging = null;
let initTried = false;

/* ============================================================
   INTERNAL — ensure messaging instance
   ============================================================ */
async function ensureMessaging() {
  if (messaging) return messaging;
  if (initTried) return null;
  initTried = true;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Browser не supported");
      return null;
    }
    messaging = getMessaging(app);
    console.log("[FCM] Messaging instance ready");
    return messaging;
  } catch (err) {
    console.warn("[FCM] init failed:", err?.message);
    return null;
  }
}

/* ============================================================
   PUBLIC — support / permission
   ============================================================ */

export function isFCMSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window
  );
}

export function getNotificationPermission() {
  if (!isFCMSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isFCMSupported()) {
    throw new Error("এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই");
  }
  if (!VAPID) {
    throw new Error(
      "VAPID key সেট করা হয়নি। Firebase Console → Project Settings → Cloud Messaging → Web Push certificates চেক করুন।"
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("নোটিফিকেশন অনুমতি দেওয়া হয়নি। ব্রাউজারে Allow করুন।");
  }
  return permission;
}

/* ============================================================
   REGISTER TOKEN — main flow with step logs + timeouts
   ============================================================ */

export async function registerFCMToken(uid) {
  if (!uid) throw new Error("UID প্রয়োজন");
  if (!VAPID) {
    throw new Error(
      "VAPID key সেট করা হয়নি (.env ফাইল চেক করুন — VITE_FIREBASE_VAPID_KEY)"
    );
  }

  /* ---------- 1. Messaging support ---------- */
  console.log("[FCM] 1/5 — Checking messaging support...");
  const msg = await ensureMessaging();
  if (!msg) throw new Error("এই ব্রাউজারে FCM সাপোর্ট করে না");

  /* ---------- 2. Permission ---------- */
  console.log("[FCM] 2/5 — Checking notification permission...");
  const perm = getNotificationPermission();
  if (perm !== "granted") {
    console.log("[FCM]      Requesting permission...");
    await requestNotificationPermission();
  }
  console.log("[FCM]      Permission:", Notification.permission);

  /* ---------- 3. Service worker ---------- */
  console.log("[FCM] 3/5 — Registering service worker...");
  let swReg = null;
  try {
    swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("[FCM]      SW registered:", swReg.scope);

    if (!swReg.active) {
      console.log("[FCM]      Waiting for activation...");
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("SW activation timeout")), 10000)
        ),
      ]);
    }
    console.log("[FCM]      SW state:", swReg.active?.state || "ready");
  } catch (err) {
    console.warn("[FCM]      SW registration warning:", err.message);
    // Continue — getToken can still work
  }

  /* ---------- 4. Get FCM token (with 15s timeout) ---------- */
  console.log("[FCM] 4/5 — Getting FCM token...");
  let token;
  try {
    token = await Promise.race([
      getToken(msg, {
        vapidKey: VAPID,
        serviceWorkerRegistration: swReg || undefined,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("getToken timeout (15s)")), 15000)
      ),
    ]);
  } catch (err) {
    console.error("[FCM]      getToken failed:", err);
    throw new Error(
      `Token পাওয়া যায়নি: ${err.message}. ইন্টারনেট বা VAPID key চেক করুন।`
    );
  }

  if (!token) throw new Error("FCM token খালি এসেছে");
  console.log("[FCM]      ✓ Token:", token.slice(0, 45) + "...");

  /* ---------- 5. Save to Firestore ---------- */
  console.log("[FCM] 5/5 — Saving to Firestore...");
  try {
    const tokensRef = collection(db, "users", uid, "fcmTokens");
    const dupQuery = query(tokensRef, where("token", "==", token));
    const existing = await getDocs(dupQuery);

    if (!existing.empty) {
      console.log("[FCM]      ✓ Token already saved");
      return { token, alreadyExists: true };
    }

    await addDoc(tokensRef, {
      token,
      platform: detectPlatform(),
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    });
    console.log("[FCM]      ✓ Token saved to Firestore");
  } catch (err) {
    console.error("[FCM]      Firestore save failed:", err);
    throw new Error(
      `Token Firestore এ save করা যায়নি: ${err.message}`
    );
  }

  return { token, alreadyExists: false };
}

/* ============================================================
   UNREGISTER / CLEANUP
   ============================================================ */

export async function unregisterFCMToken(uid, token) {
  if (!uid || !token) return;
  const tokensRef = collection(db, "users", uid, "fcmTokens");
  const dupQuery = query(tokensRef, where("token", "==", token));
  const snap = await getDocs(dupQuery);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, "users", uid, "fcmTokens", d.id));
  }
}

export async function removeAllTokens(uid) {
  if (!uid) return;
  const snap = await getDocs(collection(db, "users", uid, "fcmTokens"));
  for (const d of snap.docs) {
    await deleteDoc(doc(db, "users", uid, "fcmTokens", d.id));
  }
}

/* ============================================================
   FOREGROUND MESSAGES
   ============================================================ */

export async function onForegroundMessage(callback) {
  const msg = await ensureMessaging();
  if (!msg) return () => {};
  return onMessage(msg, callback);
}

/* ============================================================
   HELPERS
   ============================================================ */

function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/mac/i.test(ua)) return "mac";
  if (/windows/i.test(ua)) return "windows";
  if (/linux/i.test(ua)) return "linux";
  return "web";
}