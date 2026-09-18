import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const USAGE = "usage";

const DEFAULT_USAGE = {
  products: 0,
  categories: 0,
  customers: 0,
  users: 1,
  invoices: 0,
  sms: 0,
  reports: 0,
  storage: 0, // in MB
  lastResetAt: null,
};

/* ============================================================
   READ
   ============================================================ */

export async function getUsage(workspaceId) {
  if (!workspaceId) return { ...DEFAULT_USAGE };
  const snap = await getDoc(doc(db, USAGE, workspaceId));
  if (!snap.exists()) return { ...DEFAULT_USAGE };
  return { ...DEFAULT_USAGE, ...snap.data() };
}

/* ============================================================
   INIT
   ============================================================ */

export async function ensureUsage(workspaceId) {
  if (!workspaceId) return;
  const ref = doc(db, USAGE, workspaceId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    ...DEFAULT_USAGE,
    workspaceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
   INCREMENT / DECREMENT
   ============================================================ */

export async function incrementUsage(workspaceId, key, amount = 1) {
  if (!workspaceId || !key) return;
  const ref = doc(db, USAGE, workspaceId);
  await setDoc(
    ref,
    {
      [key]: increment(Number(amount) || 1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function decrementUsage(workspaceId, key, amount = 1) {
  if (!workspaceId || !key) return;
  const current = await getUsage(workspaceId);
  const value = Math.max(0, (Number(current[key]) || 0) - (Number(amount) || 1));
  await setDoc(
    doc(db, USAGE, workspaceId),
    { [key]: value, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function setUsageValue(workspaceId, key, value) {
  if (!workspaceId || !key) return;
  await setDoc(
    doc(db, USAGE, workspaceId),
    { [key]: Math.max(0, Number(value) || 0), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function bulkSetUsage(workspaceId, patch = {}) {
  if (!workspaceId) return;
  await setDoc(
    doc(db, USAGE, workspaceId),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ============================================================
   MONTHLY RESET (invoices / sms / reports)
   ============================================================ */

export async function resetMonthlyUsage(workspaceId, keys = ["invoices", "sms", "reports"]) {
  if (!workspaceId) return;
  const patch = {};
  keys.forEach((k) => { patch[k] = 0; });
  patch.lastResetAt = new Date().toISOString();
  patch.updatedAt = serverTimestamp();
  await setDoc(doc(db, USAGE, workspaceId), patch, { merge: true });
}

/* ============================================================
   USAGE % HELPERS
   ============================================================ */

export function usagePercent(used, limit) {
  if (limit === "unlimited") return 0;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((Number(used) / Number(limit)) * 100));
}

export function usageStatus(used, limit) {
  if (limit === "unlimited") return "ok";
  const pct = usagePercent(used, limit);
  if (pct >= 100) return "exceeded";
  if (pct >= 80) return "warning";
  return "ok";
}

export function remainingQuota(used, limit) {
  if (limit === "unlimited") return Infinity;
  return Math.max(0, (Number(limit) || 0) - (Number(used) || 0));
}