import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  DEFAULT_PACKAGES, DEFAULT_PRICING_SETTINGS, expandPackage,
} from "@/config/packages";

const PKG = "packages";
const SETTINGS = "settings";

/* ============================================================
   READ
   ============================================================ */

export async function listPackages({ onlyActive = false, max = 100 } = {}) {
  const col = collection(db, PKG);
  const q = onlyActive
    ? query(col, where("active", "==", true), qLimit(max))
    : query(col, qLimit(max));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // sort by order
  return list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export async function getPackage(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, PKG, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ============================================================
   CREATE / UPDATE / DELETE
   ============================================================ */

export async function createPackage(data, actor) {
  const clean = sanitizePackage(data);
  const ref = await addDoc(collection(db, PKG), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });
  await audit(actor, "package.created", { packageId: ref.id, name: clean.name });
  return ref.id;
}

export async function updatePackage(id, patch, actor) {
  if (!id) throw new Error("packageId প্রয়োজন");
  const clean = sanitizePackage(patch, { partial: true });
  await updateDoc(doc(db, PKG, id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
  await audit(actor, "package.updated", { packageId: id });
}

export async function deletePackage(id, actor) {
  if (!id) throw new Error("packageId প্রয়োজন");
  await deleteDoc(doc(db, PKG, id));
  await audit(actor, "package.deleted", { packageId: id });
}

export async function duplicatePackage(id, actor) {
  const original = await getPackage(id);
  if (!original) throw new Error("প্যাকেজ পাওয়া যায়নি");
  const { id: _drop, createdAt, updatedAt, createdBy, ...rest } = original;
  const newName = (original.name || "প্যাকেজ") + " (কপি)";
  const ref = await addDoc(collection(db, PKG), {
    ...rest,
    name: newName,
    order: (original.order ?? 999) + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });
  await audit(actor, "package.duplicated", { from: id, to: ref.id });
  return ref.id;
}

export async function togglePackageActive(id, active, actor) {
  await updateDoc(doc(db, PKG, id), {
    active: !!active,
    updatedAt: serverTimestamp(),
  });
  await audit(actor, active ? "package.activated" : "package.deactivated", {
    packageId: id,
  });
}

/* ============================================================
   SEED DEFAULT PACKAGES
   ============================================================ */

export async function seedDefaultPackages(actor, { overwrite = false } = {}) {
  const existing = await listPackages({ max: 200 });
  const existingIds = new Set(existing.map((p) => p.id));

  const batch = writeBatch(db);
  let count = 0;

  for (const seed of DEFAULT_PACKAGES) {
    if (!overwrite && existingIds.has(seed.id)) continue;

    const tree = expandPackage(seed);
    const payload = {
      name: seed.name,
      badge: seed.badge || "",
      description: seed.description || "",
      icon: seed.icon || "Package",
      color: seed.color || "#C9B994",
      monthlyPrice: seed.monthlyPrice || 0,
      yearlyDiscount:
        seed.yearlyDiscount ?? DEFAULT_PRICING_SETTINGS.yearlyDiscount,
      fiveYearDiscount:
        seed.fiveYearDiscount ?? DEFAULT_PRICING_SETTINGS.fiveYearDiscount,
      active: seed.active ?? true,
      popular: !!seed.popular,
      order: seed.order ?? 999,
      limits: seed.limits || {},
      pages: tree,
      isDefault: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: actor?.uid || null,
    };

    const ref = doc(db, PKG, seed.id);
    batch.set(ref, payload, { merge: true });
    count++;
  }

  if (count > 0) {
    await batch.commit();
    await audit(actor, "package.seeded", { count });
  }

  return count;
}

/* ============================================================
   HELPERS
   ============================================================ */

function sanitizePackage(input = {}, { partial = false } = {}) {
  const allowed = [
    "name", "badge", "description", "icon", "color",
    "monthlyPrice", "yearlyDiscount", "fiveYearDiscount",
    "active", "popular", "order", "limits", "pages",
  ];
  const out = {};
  for (const key of allowed) {
    if (key in input) out[key] = input[key];
  }
  if (!partial) {
    out.name = (input.name || "").trim() || "নতুন প্যাকেজ";
    out.monthlyPrice = Math.max(0, Number(input.monthlyPrice) || 0);
    out.yearlyDiscount = clampPct(input.yearlyDiscount, 15);
    out.fiveYearDiscount = clampPct(input.fiveYearDiscount, 30);
    out.active = input.active !== false;
    out.order = Number(input.order) || 999;
    out.limits = input.limits || {};
    out.pages = input.pages || {};
  } else {
    if ("monthlyPrice" in out) out.monthlyPrice = Math.max(0, Number(out.monthlyPrice) || 0);
    if ("yearlyDiscount" in out) out.yearlyDiscount = clampPct(out.yearlyDiscount, 15);
    if ("fiveYearDiscount" in out) out.fiveYearDiscount = clampPct(out.fiveYearDiscount, 30);
  }
  return out;
}

function clampPct(v, fallback = 0) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

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
    /* ignore audit errors */
  }
}