import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  orderBy, query, serverTimestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { incrementUsage, decrementUsage, setUsageValue } from "./usageService";

const WS = "workspaces";

function col(workspaceId, sub) {
  return collection(db, WS, workspaceId, sub);
}

/* ============================================================
   LIST
   ============================================================ */

export async function listProducts(workspaceId, { max = 500, categoryId } = {}) {
  if (!workspaceId) return [];
  const colRef = col(workspaceId, "products");
  const q = categoryId
    ? query(colRef, where("categoryId", "==", categoryId), qLimit(max))
    : query(colRef, qLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProduct(workspaceId, productId) {
  if (!workspaceId || !productId) return null;
  const snap = await getDoc(doc(db, WS, workspaceId, "products", productId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ============================================================
   CREATE
   ============================================================ */

export async function createProduct(workspaceId, data, actor) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");

  const clean = sanitizeProduct(data);
  const ref = await addDoc(col(workspaceId, "products"), {
    ...clean,
    workspaceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });

  // Update usage counter
  try {
    await incrementUsage(workspaceId, "products", 1);
  } catch (err) {
    if (import.meta.env.DEV) console.error("[usage inc]", err);
  }

  return ref.id;
}

/* ============================================================
   UPDATE
   ============================================================ */

export async function updateProduct(workspaceId, productId, patch) {
  if (!workspaceId || !productId) throw new Error("id প্রয়োজন");
  const clean = sanitizeProduct(patch, { partial: true });
  await updateDoc(doc(db, WS, workspaceId, "products", productId), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
   DELETE
   ============================================================ */

export async function deleteProduct(workspaceId, productId) {
  if (!workspaceId || !productId) throw new Error("id প্রয়োজন");
  await deleteDoc(doc(db, WS, workspaceId, "products", productId));
  try {
    await decrementUsage(workspaceId, "products", 1);
  } catch (err) {
    if (import.meta.env.DEV) console.error("[usage dec]", err);
  }
}

/* ============================================================
   RECOUNT — reconcile usage counter with actual count
   ============================================================ */

export async function recountProducts(workspaceId) {
  if (!workspaceId) return 0;
  const snap = await getDocs(col(workspaceId, "products"));
  const count = snap.size;
  await setUsageValue(workspaceId, "products", count);
  return count;
}

/* ============================================================
   HELPERS
   ============================================================ */

function sanitizeProduct(input = {}, { partial = false } = {}) {
  const out = {};

  if ("name" in input) out.name = String(input.name || "").trim();
  if ("categoryId" in input) out.categoryId = input.categoryId || null;
  if ("categoryNameSnapshot" in input)
    out.categoryNameSnapshot = String(input.categoryNameSnapshot || "");
  if ("model" in input) out.model = String(input.model || "").trim();
  if ("buyUnitPrice" in input)
    out.buyUnitPrice = Math.max(0, Number(input.buyUnitPrice) || 0);
  if ("sellUnitPrice" in input)
    out.sellUnitPrice = Math.max(0, Number(input.sellUnitPrice) || 0);
  if ("currentStock" in input)
    out.currentStock = Math.max(0, Number(input.currentStock) || 0);
  if ("openingStock" in input)
    out.openingStock = Math.max(0, Number(input.openingStock) || 0);
  if ("description" in input) out.description = String(input.description || "");
  if ("image" in input) out.image = input.image || null;
  if ("images" in input) out.images = Array.isArray(input.images) ? input.images : [];
  if ("sku" in input) out.sku = String(input.sku || "").trim();
  if ("barcode" in input) out.barcode = String(input.barcode || "").trim();
  if ("supplier" in input) out.supplier = String(input.supplier || "");
  if ("status" in input) out.status = input.status || "active";

  if (!partial) {
    out.name = out.name || "নামবিহীন";
    out.buyUnitPrice = out.buyUnitPrice ?? 0;
    out.sellUnitPrice = out.sellUnitPrice ?? 0;
    out.currentStock = out.currentStock ?? 0;
    out.status = out.status || "active";
  }

  return out;
}