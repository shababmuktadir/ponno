import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { incrementUsage, decrementUsage, setUsageValue } from "./usageService";

const WS = "workspaces";

function col(workspaceId) {
  return collection(db, WS, workspaceId, "categories");
}

/* ---------- LIST ---------- */

export async function listCategories(workspaceId, { max = 500 } = {}) {
  if (!workspaceId) return [];
  const snap = await getDocs(col(workspaceId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .slice(0, max)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function getCategory(workspaceId, id) {
  if (!workspaceId || !id) return null;
  const snap = await getDoc(doc(db, WS, workspaceId, "categories", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ---------- CREATE ---------- */

export async function createCategory(workspaceId, data, actor) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");
  const clean = sanitize(data);

  const ref = await addDoc(col(workspaceId), {
    ...clean,
    workspaceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });

  try {
    await incrementUsage(workspaceId, "categories", 1);
  } catch (err) {
    if (import.meta.env.DEV) console.error("[usage inc]", err);
  }

  return ref.id;
}

/* ---------- UPDATE ---------- */

export async function updateCategory(workspaceId, id, patch) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  const clean = sanitize(patch, { partial: true });
  await updateDoc(doc(db, WS, workspaceId, "categories", id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

/* ---------- DELETE ---------- */

export async function deleteCategory(workspaceId, id) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  await deleteDoc(doc(db, WS, workspaceId, "categories", id));
  try {
    await decrementUsage(workspaceId, "categories", 1);
  } catch (err) {
    if (import.meta.env.DEV) console.error("[usage dec]", err);
  }
}

/* ---------- RECOUNT ---------- */

export async function recountCategories(workspaceId) {
  if (!workspaceId) return 0;
  const snap = await getDocs(col(workspaceId));
  await setUsageValue(workspaceId, "categories", snap.size);
  return snap.size;
}

/* ---------- HELPERS ---------- */

function sanitize(input = {}, { partial = false } = {}) {
  const out = {};
  if ("name" in input) out.name = String(input.name || "").trim();
  if ("description" in input) out.description = String(input.description || "");
  if ("image" in input) out.image = input.image || null;
  if ("status" in input) out.status = input.status || "active";
  if ("sortOrder" in input) out.sortOrder = Number(input.sortOrder) || 0;
  if (!partial) {
    out.name = out.name || "নামবিহীন";
    out.status = out.status || "active";
  }
  return out;
}