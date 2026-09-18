import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  serverTimestamp, updateDoc, where, query,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { incrementUsage, decrementUsage, setUsageValue } from "./usageService";

const WS = "workspaces";

function col(workspaceId) {
  return collection(db, WS, workspaceId, "customers");
}

export async function listCustomers(workspaceId, { max = 2000, search } = {}) {
  if (!workspaceId) return [];
  const snap = await getDocs(col(workspaceId));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (search?.trim()) {
    const t = search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(t) ||
        (c.phone || "").includes(t) ||
        (c.email || "").toLowerCase().includes(t)
    );
  }
  return list
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .slice(0, max);
}

export async function getCustomer(workspaceId, id) {
  if (!workspaceId || !id) return null;
  const snap = await getDoc(doc(db, WS, workspaceId, "customers", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createCustomer(workspaceId, data, actor) {
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
    await incrementUsage(workspaceId, "customers", 1);
  } catch {}
  return ref.id;
}

export async function updateCustomer(workspaceId, id, patch) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  const clean = sanitize(patch, { partial: true });
  await updateDoc(doc(db, WS, workspaceId, "customers", id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(workspaceId, id) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  await deleteDoc(doc(db, WS, workspaceId, "customers", id));
  try {
    await decrementUsage(workspaceId, "customers", 1);
  } catch {}
}

export async function recountCustomers(workspaceId) {
  if (!workspaceId) return 0;
  const snap = await getDocs(col(workspaceId));
  await setUsageValue(workspaceId, "customers", snap.size);
  return snap.size;
}

function sanitize(input = {}, { partial = false } = {}) {
  const out = {};
  if ("name" in input) out.name = String(input.name || "").trim();
  if ("phone" in input) out.phone = String(input.phone || "").trim();
  if ("email" in input) out.email = String(input.email || "").trim().toLowerCase();
  if ("address" in input) out.address = String(input.address || "");
  if ("notes" in input) out.notes = String(input.notes || "");
  if ("tags" in input) out.tags = Array.isArray(input.tags) ? input.tags : [];
  if ("balance" in input) out.balance = Number(input.balance) || 0;
  if ("status" in input) out.status = input.status || "active";
  if (!partial) {
    out.name = out.name || "নামবিহীন";
    out.status = out.status || "active";
  }
  return out;
}