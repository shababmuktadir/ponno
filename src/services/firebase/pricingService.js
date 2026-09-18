import {
  doc, getDoc, setDoc, serverTimestamp, addDoc, collection,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { DEFAULT_PRICING_SETTINGS } from "@/config/packages";

const REF = () => doc(db, "settings", "pricing");

export async function getPricingSettings() {
  try {
    const snap = await getDoc(REF());
    if (snap.exists()) {
      return { ...DEFAULT_PRICING_SETTINGS, ...snap.data() };
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error("[pricing settings]", err);
  }
  return { ...DEFAULT_PRICING_SETTINGS };
}

export async function savePricingSettings(patch, actor) {
  const clean = {
    yearlyDiscount: clampPct(patch.yearlyDiscount, DEFAULT_PRICING_SETTINGS.yearlyDiscount),
    fiveYearDiscount: clampPct(patch.fiveYearDiscount, DEFAULT_PRICING_SETTINGS.fiveYearDiscount),
    currency: patch.currency || "BDT",
    currencySymbol: patch.currencySymbol || "৳",
    yearlyEnabled: patch.yearlyEnabled !== false,
    fiveYearEnabled: patch.fiveYearEnabled !== false,
    updatedAt: serverTimestamp(),
    updatedBy: actor?.uid || null,
  };

  await setDoc(REF(), clean, { merge: true });

  try {
    await addDoc(collection(db, "auditLogs"), {
      actorId: actor?.uid || null,
      actorName: actor?.name || "",
      actorRole: actor?.role || "unknown",
      action: "pricing.updated",
      meta: clean,
      createdAt: serverTimestamp(),
    });
  } catch {
    /* ignore */
  }

  return clean;
}

function clampPct(v, fallback = 0) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}