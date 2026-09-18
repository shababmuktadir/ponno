import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  onSnapshot, orderBy, query, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const RENEWALS = "renewals";

/* ============================================================
   CREATE RENEWAL — when admin renews a subscription
   ============================================================ */

export async function logRenewal({
  subscriptionId,
  userId,
  userName,
  userEmail,
  packageId,
  packageName,
  billingPeriod,
  amount,
  currency = "BDT",
  paymentMethod = "manual",
  note = "",
  actor,
}) {
  if (!userId) throw new Error("userId প্রয়োজন");
  if (!amount || Number(amount) <= 0)
    throw new Error("পরিমাণ ০ এর বেশি হতে হবে");

  const ref = await addDoc(collection(db, RENEWALS), {
    subscriptionId: subscriptionId || null,
    userId,
    userName: userName || "",
    userEmail: userEmail || "",
    packageId: packageId || "",
    packageName: packageName || "",
    billingPeriod: billingPeriod || "monthly",
    amount: Number(amount),
    currency,
    paymentMethod,
    note,
    createdAt: serverTimestamp(),
    createdBy: actor?.uid || null,
    createdByName: actor?.name || "",
  });

  return ref.id;
}

/* ============================================================
   LIST — all renewals (admin)
   ============================================================ */

export async function listRenewals({ max = 1000 } = {}) {
  const q = query(
    collection(db, RENEWALS),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function watchRenewals(callback, { max = 1000 } = {}) {
  const q = query(
    collection(db, RENEWALS),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      if (import.meta.env.DEV) console.error("[renewals watch]", err);
    }
  );
}

export async function listUserRenewals(userId, max = 100) {
  if (!userId) return [];
  const q = query(
    collection(db, RENEWALS),
    where("userId", "==", userId),
    qLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/* ============================================================
   DELETE — single or all (admin)
   ============================================================ */

export async function deleteRenewal(id) {
  if (!id) return;
  await deleteDoc(doc(db, RENEWALS, id));
}

export async function deleteAllRenewals() {
  const snap = await getDocs(collection(db, RENEWALS));
  let count = 0;
  for (const d of snap.docs) {
    await deleteDoc(doc(db, RENEWALS, d.id));
    count++;
  }
  return count;
}

/* ============================================================
   AGGREGATE — monthly / yearly report
   ============================================================ */

export function aggregateRenewals(renewals = []) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let total = 0;
  let thisMonth = 0;
  let thisYear = 0;
  let monthlyCount = 0;
  let yearlyCount = 0;
  let fiveYearCount = 0;

  const byMonth = {}; // "2026-09" → amount
  const byYear = {}; // "2026" → amount
  const byPackage = {}; // packageName → amount

  renewals.forEach((r) => {
    const ms = r.createdAt?.seconds ? r.createdAt.seconds * 1000 : 0;
    const d = ms ? new Date(ms) : null;
    const amt = Number(r.amount) || 0;

    total += amt;

    if (d) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        thisMonth += amt;
      }
      if (d.getFullYear() === year) {
        thisYear += amt;
      }

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + amt;

      const yearKey = String(d.getFullYear());
      byYear[yearKey] = (byYear[yearKey] || 0) + amt;
    }

    // Billing period counters
    if (r.billingPeriod === "monthly") monthlyCount++;
    else if (r.billingPeriod === "yearly") yearlyCount++;
    else if (r.billingPeriod === "fiveYear") fiveYearCount++;

    // Package breakdown
    const pname = r.packageName || r.packageId || "অন্যান্য";
    byPackage[pname] = (byPackage[pname] || 0) + amt;
  });

  return {
    total,
    thisMonth,
    thisYear,
    monthlyCount,
    yearlyCount,
    fiveYearCount,
    count: renewals.length,
    byMonth,
    byYear,
    byPackage,
  };
}