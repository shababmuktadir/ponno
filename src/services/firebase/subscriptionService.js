import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  query, serverTimestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { getPackage } from "./packageService";
import { ensureUsage } from "./usageService";

const SUBS = "subscriptions";
const USERS = "users";

/* ============================================================
   DURATION HELPERS
   ============================================================ */

export function calcEndDate(startDate, billingPeriod, customDays) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = new Date(start);

  switch (billingPeriod) {
    case "monthly":
      end.setMonth(end.getMonth() + 1);
      break;
    case "yearly":
      end.setMonth(end.getMonth() + 12);
      break;
    case "fiveYear":
      end.setMonth(end.getMonth() + 60);
      break;
    case "custom": {
      const d = Math.max(1, Number(customDays) || 1);
      end.setDate(end.getDate() + d);
      break;
    }
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export function calcDurationDays(billingPeriod, customDays) {
  switch (billingPeriod) {
    case "monthly":  return 30;
    case "yearly":   return 365;
    case "fiveYear": return 365 * 5;
    case "custom":   return Math.max(1, Number(customDays) || 1);
    default:         return 30;
  }
}

/* ============================================================
   READ
   ============================================================ */

export async function listUserSubscriptions(userId, max = 50) {
  if (!userId) return [];
  const q = query(
    collection(db, SUBS),
    where("userId", "==", userId),
    qLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getActiveSubscriptionForUser(userId) {
  const list = await listUserSubscriptions(userId, 20);
  const now = Date.now();
  return (
    list.find((s) => {
      if (s.status !== "active") return false;
      const end = s.endDate ? new Date(s.endDate).getTime() : null;
      return !end || end > now;
    }) || null
  );
}

export async function listAllSubscriptions({ max = 500 } = {}) {
  const snap = await getDocs(query(collection(db, SUBS), qLimit(max)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getSubscription(subscriptionId) {
  if (!subscriptionId) return null;
  const snap = await getDoc(doc(db, SUBS, subscriptionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ============================================================
   ASSIGN / CHANGE
   ============================================================ */

export async function assignPackageToUser({
  userId,
  packageId,
  billingPeriod = "monthly",
  customDays = 30,
  amountPaid = 0,
  discountPct = 0,
  paymentMethod = "manual",
  notes = "",
  actor,
  workspaceId,
}) {
  if (!userId) throw new Error("userId প্রয়োজন");
  if (!packageId) throw new Error("packageId প্রয়োজন");

  const pkg = await getPackage(packageId);
  if (!pkg) throw new Error("প্যাকেজ পাওয়া যায়নি");

  const now = new Date();
  const end = calcEndDate(now, billingPeriod, customDays);
  const durationDays = calcDurationDays(billingPeriod, customDays);

  // Fetch existing subs + user in parallel
  const [userSubs, userSnap] = await Promise.all([
    listUserSubscriptions(userId, 30),
    getDoc(doc(db, USERS, userId)),
  ]);

  const userData = userSnap.exists() ? userSnap.data() : {};
  const wsId = workspaceId || userData.workspaceId || null;

  const batch = writeBatch(db);

  // Mark existing active subs as expired
  userSubs
    .filter((s) => s.status === "active")
    .forEach((s) => {
      batch.update(doc(db, SUBS, s.id), {
        status: "expired",
        updatedAt: serverTimestamp(),
      });
    });

  // Create new subscription
  const subRef = doc(collection(db, SUBS));
  const subPayload = {
    userId,
    workspaceId: wsId,
    packageId,
    packageName: pkg.name || packageId,
    billingPeriod,
    durationDays,
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    amountPaid: Math.max(0, Number(amountPaid) || 0),
    discountPct: Math.max(0, Number(discountPct) || 0),
    paymentMethod,
    notes,
    status: "active",
    createdBy: actor?.uid || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(subRef, subPayload);

  // Update user doc
  batch.update(doc(db, USERS, userId), {
    packageId,
    subscriptionStatus: "active",
    subscriptionStart: now.toISOString(),
    subscriptionEnd: end.toISOString(),
    billingPeriod,
    accountStatus: "active",
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  // Ensure usage doc exists
  if (wsId) {
    try {
      await ensureUsage(wsId);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[ensureUsage]", err);
    }
  }

  await audit(actor, "subscription.assigned", {
    userId,
    packageId,
    billingPeriod,
    durationDays,
  });

  return { id: subRef.id, ...subPayload };
}

export async function changePackageForUser({
  userId,
  newPackageId,
  billingPeriod = "monthly",
  customDays = 30,
  amountPaid = 0,
  actor,
  notes = "প্যাকেজ পরিবর্তন",
}) {
  return assignPackageToUser({
    userId,
    packageId: newPackageId,
    billingPeriod,
    customDays,
    amountPaid,
    paymentMethod: "change",
    notes,
    actor,
  });
}

/* ============================================================
   CANCEL / EXTEND / DELETE
   ============================================================ */

export async function cancelSubscription(subscriptionId, actor, reason = "") {
  const ref = doc(db, SUBS, subscriptionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("সাবস্ক্রিপশন পাওয়া যায়নি");
  const data = snap.data();

  await updateDoc(ref, {
    status: "cancelled",
    cancelledAt: serverTimestamp(),
    cancelReason: reason,
    updatedAt: serverTimestamp(),
  });

  // If this was the user's active sub, reset user to free
  if (data.userId) {
    await updateDoc(doc(db, USERS, data.userId), {
      packageId: "free",
      subscriptionStatus: "cancelled",
      updatedAt: serverTimestamp(),
    });
  }

  await audit(actor, "subscription.cancelled", { subscriptionId });
}

export async function extendSubscription(subscriptionId, extraDays, actor) {
  const ref = doc(db, SUBS, subscriptionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("সাবস্ক্রিপশন পাওয়া যায়নি");
  const data = snap.data();

  const currentEnd = data.endDate ? new Date(data.endDate) : new Date();
  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + Math.max(1, Number(extraDays) || 1));

  await updateDoc(ref, {
    endDate: newEnd.toISOString(),
    durationDays: (Number(data.durationDays) || 0) + Number(extraDays || 0),
    updatedAt: serverTimestamp(),
  });

  // Sync to user doc
  if (data.userId) {
    await updateDoc(doc(db, USERS, data.userId), {
      subscriptionEnd: newEnd.toISOString(),
      subscriptionStatus: "active",
      updatedAt: serverTimestamp(),
    });
  }

  await audit(actor, "subscription.extended", { subscriptionId, extraDays });
}

export async function deleteSubscription(subscriptionId, actor) {
  await deleteDoc(doc(db, SUBS, subscriptionId));
  await audit(actor, "subscription.deleted", { subscriptionId });
}

/* ============================================================
   EXPIRY CHECK
   ============================================================ */

export async function checkAndExpireUserSubscription(userId) {
  if (!userId) return null;
  const active = await getActiveSubscriptionForUser(userId);
  if (active) return active;

  const userRef = doc(db, USERS, userId);
  const uSnap = await getDoc(userRef);
  if (uSnap.exists() && uSnap.data().subscriptionStatus === "active") {
    await updateDoc(userRef, {
      subscriptionStatus: "expired",
      updatedAt: serverTimestamp(),
    });
  }
  return null;
}

/* ============================================================
   HELPERS
   ============================================================ */

async function audit(actor, action, meta = {}) {
  try {
    await addDoc(collection(db, "auditLogs"), {
      actorId: actor?.uid || null,
      actorName: actor?.name || "",
      actorRole: actor?.role || "unknown",
      action,
      meta,
      createdAt: serverTimestamp(),
    });
  } catch {
    /* ignore */
  }
}
import { logRenewal } from "./renewalService";

/**
 * Renew a subscription with payment tracking.
 * Adds a renewal record for admin earnings.
 */
export async function renewSubscription({
  subscriptionId,
  userId,
  packageId,
  packageName,
  billingPeriod = "monthly",
  customDays = 30,
  amount,
  paymentMethod = "manual",
  note = "",
  actor,
  userName,
  userEmail,
}) {
  if (!subscriptionId) throw new Error("subscriptionId প্রয়োজন");
  if (!amount || Number(amount) <= 0)
    throw new Error("পরিমাণ দিন");

  // 1) Extend the subscription
  const durationMap = {
    monthly: 30,
    yearly: 365,
    fiveYear: 365 * 5,
  };
  const days =
    billingPeriod === "custom"
      ? Math.max(1, Number(customDays) || 1)
      : durationMap[billingPeriod] || 30;

  const ref = doc(db, SUBS, subscriptionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("সাবস্ক্রিপশন পাওয়া যায়নি");
  const data = snap.data();

  const currentEnd = data.endDate ? new Date(data.endDate) : new Date();
  const now = new Date();
  const baseDate = currentEnd > now ? currentEnd : now;
  const newEnd = new Date(baseDate);
  newEnd.setDate(newEnd.getDate() + days);

  await updateDoc(ref, {
    endDate: newEnd.toISOString(),
    durationDays: (Number(data.durationDays) || 0) + days,
    status: "active",
    lastRenewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2) Update user doc expiry
  if (userId) {
    await updateDoc(doc(db, USERS, userId), {
      subscriptionEnd: newEnd.toISOString(),
      subscriptionStatus: "active",
      accountStatus: "active",
      updatedAt: serverTimestamp(),
    });
  }

  // 3) Log renewal for admin earnings
  await logRenewal({
    subscriptionId,
    userId,
    userName,
    userEmail,
    packageId,
    packageName,
    billingPeriod,
    amount: Number(amount),
    paymentMethod,
    note,
    actor,
  });

  await audit(actor, "subscription.renewed", {
    subscriptionId,
    userId,
    billingPeriod,
    amount: Number(amount),
    newEnd: newEnd.toISOString(),
  });

  return { newEnd: newEnd.toISOString(), days };
}