import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  orderBy, query, runTransaction, serverTimestamp, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const WS = "workspaces";

function txCol(workspaceId) {
  return collection(db, WS, workspaceId, "stockTransactions");
}

/* ============================================================
   TRANSACTION TYPES
   ============================================================ */
export const TX_TYPES = {
  PURCHASE: "purchase",
  SALE: "sale",
  ADJUSTMENT_ADD: "adjustment_add",
  ADJUSTMENT_REMOVE: "adjustment_remove",
};

export const TX_LABELS = {
  purchase: "ক্রয়",
  sale: "বিক্রয়",
  adjustment_add: "স্টক যোগ (অ্যাডজাস্ট)",
  adjustment_remove: "স্টক কমানো (অ্যাডজাস্ট)",
};

/* ============================================================
   LIST TRANSACTIONS
   ============================================================ */

export async function listTransactions(workspaceId, { max = 500, productId } = {}) {
  if (!workspaceId) return [];
  const col = txCol(workspaceId);
  const q = productId
    ? query(col, where("productId", "==", productId), qLimit(max))
    : query(col, qLimit(max));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
}

export async function getTransaction(workspaceId, id) {
  if (!workspaceId || !id) return null;
  const snap = await getDoc(doc(db, WS, workspaceId, "stockTransactions", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ============================================================
   CREATE TRANSACTION (atomic — updates product.currentStock)
   ============================================================ */

export async function createTransaction(
  workspaceId,
  data,
  actor
) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");
  if (!data.productId) throw new Error("প্রোডাক্ট নির্বাচন করুন");
  if (!data.type) throw new Error("ট্রানজেকশন ধরন প্রয়োজন");

  const qty = Number(data.quantity) || 0;
  if (qty <= 0) throw new Error("পরিমাণ ১ বা তার বেশি হতে হবে");

  const unitPrice = Number(data.unitPrice) || 0;
  const totalAmount = qty * unitPrice;

  // Determine stock delta
  const sign =
    data.type === TX_TYPES.PURCHASE || data.type === TX_TYPES.ADJUSTMENT_ADD
      ? +1
      : -1;

  const txRef = doc(txCol(workspaceId));
  const productRef = doc(
    db,
    WS,
    workspaceId,
    "products",
    data.productId
  );

  const result = await runTransaction(db, async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists()) throw new Error("প্রোডাক্ট পাওয়া যায়নি");

    const product = productSnap.data();
    const currentStock = Number(product.currentStock) || 0;
    const newStock = currentStock + sign * qty;

    if (newStock < 0) {
      throw new Error(
        `স্টক কমে যাবে নেগেটিভ — বর্তমান স্টক ${currentStock}, চাওয়া ${qty}`
      );
    }

    const payload = {
      workspaceId,
      productId: data.productId,
      productName: data.productName || product.name || "",
      productModel: data.productModel || product.model || "",
      categoryId: data.categoryId || product.categoryId || null,
      categoryNameSnapshot:
        data.categoryNameSnapshot || product.categoryNameSnapshot || "",
      type: data.type,
      quantity: qty,
      unitPrice,
      totalAmount,
      source: data.source || "manual",
      note: data.note || "",
      date: data.date ? new Date(data.date) : serverTimestamp(),
      stockBefore: currentStock,
      stockAfter: newStock,
      createdBy: actor?.uid || null,
      createdAt: serverTimestamp(),
    };

    tx.set(txRef, payload);

    tx.update(productRef, {
      currentStock: newStock,
      updatedAt: serverTimestamp(),
    });

    return { id: txRef.id, ...payload, currentStock: newStock };
  });

  return result;
}

/* ============================================================
   DELETE TRANSACTION (reverses stock effect)
   ============================================================ */

export async function deleteTransaction(workspaceId, transactionId) {
  if (!workspaceId || !transactionId) throw new Error("id প্রয়োজন");

  const txRef = doc(txCol(workspaceId), transactionId);

  await runTransaction(db, async (tx) => {
    const txSnap = await tx.get(txRef);
    if (!txSnap.exists()) throw new Error("ট্রানজেকশন পাওয়া যায়নি");
    const t = txSnap.data();

    const productRef = doc(
      db,
      WS,
      workspaceId,
      "products",
      t.productId
    );
    const productSnap = await tx.get(productRef);

    if (productSnap.exists()) {
      const currentStock = Number(productSnap.data().currentStock) || 0;
      const sign =
        t.type === TX_TYPES.PURCHASE || t.type === TX_TYPES.ADJUSTMENT_ADD
          ? -1
          : +1;
      const newStock = currentStock + sign * (Number(t.quantity) || 0);

      tx.update(productRef, {
        currentStock: Math.max(0, newStock),
        updatedAt: serverTimestamp(),
      });
    }

    tx.delete(txRef);
  });
}

/* ============================================================
   STOCK FORMULA — for a single product
   ============================================================ */

export async function computeProductStock(workspaceId, productId) {
  const txs = await listTransactions(workspaceId, { productId, max: 5000 });
  let purchases = 0;
  let sales = 0;
  let adjAdd = 0;
  let adjRemove = 0;

  txs.forEach((t) => {
    const q = Number(t.quantity) || 0;
    if (t.type === TX_TYPES.PURCHASE) purchases += q;
    else if (t.type === TX_TYPES.SALE) sales += q;
    else if (t.type === TX_TYPES.ADJUSTMENT_ADD) adjAdd += q;
    else if (t.type === TX_TYPES.ADJUSTMENT_REMOVE) adjRemove += q;
  });

  return {
    purchases,
    sales,
    adjustments: adjAdd - adjRemove,
    current: purchases + adjAdd - sales - adjRemove,
    transactionsCount: txs.length,
  };
}

/* ============================================================
   WEIGHTED AVERAGE PURCHASE PRICE
   ============================================================ */

export async function weightedAvgPurchase(workspaceId, productId) {
  const txs = await listTransactions(workspaceId, { productId, max: 5000 });
  const purchases = txs.filter((t) => t.type === TX_TYPES.PURCHASE);

  let sumQty = 0;
  let sumCost = 0;

  purchases.forEach((t) => {
    const q = Number(t.quantity) || 0;
    const p = Number(t.unitPrice) || 0;
    sumQty += q;
    sumCost += q * p;
  });

  return {
    weightedAvg: sumQty > 0 ? sumCost / sumQty : 0,
    totalQty: sumQty,
    totalCost: sumCost,
    txCount: purchases.length,
  };
}