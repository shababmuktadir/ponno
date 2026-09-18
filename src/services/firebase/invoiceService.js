import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  query, runTransaction, serverTimestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { TX_TYPES } from "./stockService";

const WS = "workspaces";

function col(workspaceId) {
  return collection(db, WS, workspaceId, "invoices");
}

/* ============================================================
   LIST / READ
   ============================================================ */

export async function listInvoices(workspaceId, { max = 500, search } = {}) {
  if (!workspaceId) return [];
  const snap = await getDocs(col(workspaceId));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (search?.trim()) {
    const t = search.trim().toLowerCase();
    list = list.filter(
      (i) =>
        (i.invoiceNumber || "").toLowerCase().includes(t) ||
        (i.customerName || "").toLowerCase().includes(t) ||
        (i.customerPhone || "").includes(t)
    );
  }
  return list.sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
}

export async function getInvoice(workspaceId, id) {
  if (!workspaceId || !id) return null;
  const snap = await getDoc(doc(db, WS, workspaceId, "invoices", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ============================================================
   CREATE INVOICE (draft — does not affect stock yet)
   ============================================================ */

export async function createInvoice(workspaceId, data, actor) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");
  if (!data.items?.length) throw new Error("কমপক্ষে ১টি আইটেম দিন");

  const clean = sanitizeInvoice(data);

  // Generate invoice number
  const invoiceNumber =
    clean.invoiceNumber || (await generateInvoiceNumber(workspaceId));

  const ref = await addDoc(col(workspaceId), {
    ...clean,
    invoiceNumber,
    workspaceId,
    status: "draft",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });

  return ref.id;
}

/* ============================================================
   UPDATE INVOICE (only if draft)
   ============================================================ */

export async function updateInvoice(workspaceId, id, patch) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  const existing = await getInvoice(workspaceId, id);
  if (!existing) throw new Error("ইনভয়েস পাওয়া যায়নি");
  if (existing.status === "finalized") {
    throw new Error("Finalize করা ইনভয়েস আর সম্পাদনা করা যাবে না");
  }
  const clean = sanitizeInvoice(patch, { partial: true });
  await updateDoc(doc(db, WS, workspaceId, "invoices", id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
   FINALIZE INVOICE
   - status = finalized
   - creates sale transactions for each item
   - reduces product stock atomically
   ============================================================ */

export async function finalizeInvoice(workspaceId, id, actor) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");

  const invoiceRef = doc(db, WS, workspaceId, "invoices", id);
  const invoiceSnap = await getDoc(invoiceRef);
  if (!invoiceSnap.exists()) throw new Error("ইনভয়েস পাওয়া যায়নি");

  const inv = invoiceSnap.data();
  if (inv.status === "finalized") throw new Error("ইনভয়েস ইতিমধ্যে finalize হয়েছে");
  if (!inv.items?.length) throw new Error("কোনো আইটেম নেই");

  const saleTxCollection = collection(db, WS, workspaceId, "stockTransactions");

  await runTransaction(db, async (tx) => {
    // 1) Reload invoice (fresh)
    const freshInv = await tx.get(invoiceRef);
    if (!freshInv.exists()) throw new Error("ইনভয়েস পাওয়া যায়নি");

    const items = freshInv.data().items || [];

    // 2) Check + update each product stock
    for (const item of items) {
      if (!item.productId) continue;
      const productRef = doc(db, WS, workspaceId, "products", item.productId);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists()) throw new Error(`প্রোডাক্ট পাওয়া যায়নি: ${item.productName}`);
      const product = productSnap.data();
      const currentStock = Number(product.currentStock) || 0;
      const qty = Number(item.quantity) || 0;
      const newStock = currentStock - qty;

      if (newStock < 0) {
        throw new Error(
          `${item.productName} — স্টক কমে যাবে (বর্তমান ${currentStock}, চাওয়া ${qty})`
        );
      }

      tx.update(productRef, {
        currentStock: newStock,
        updatedAt: serverTimestamp(),
      });

      // 3) Create sale transaction
      const txRef = doc(saleTxCollection);
      tx.set(txRef, {
        workspaceId,
        productId: item.productId,
        productName: item.productName || product.name,
        productModel: item.productModel || product.model || "",
        categoryId: item.categoryId || product.categoryId || null,
        categoryNameSnapshot:
          item.categoryNameSnapshot || product.categoryNameSnapshot || "",
        type: TX_TYPES.SALE,
        quantity: qty,
        unitPrice: Number(item.unitPrice) || 0,
        totalAmount: Number(item.total) || qty * (Number(item.unitPrice) || 0),
        source: "invoice",
        invoiceId: id,
        invoiceNumber: freshInv.data().invoiceNumber,
        customerId: freshInv.data().customerId || null,
        customerName: freshInv.data().customerName || "",
        note: `ইনভয়েস ${freshInv.data().invoiceNumber}`,
        date: freshInv.data().date || serverTimestamp(),
        stockBefore: currentStock,
        stockAfter: newStock,
        createdBy: actor?.uid || null,
        createdAt: serverTimestamp(),
      });
    }

    // 4) Mark invoice finalized
    tx.update(invoiceRef, {
      status: "finalized",
      finalizedAt: serverTimestamp(),
      finalizedBy: actor?.uid || null,
      updatedAt: serverTimestamp(),
    });
  });

  return true;
}

/* ============================================================
   DELETE
   ============================================================ */

export async function deleteInvoice(workspaceId, id) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  const inv = await getInvoice(workspaceId, id);
  if (inv?.status === "finalized") {
    throw new Error("Finalize করা ইনভয়েস ডিলিট করা যাবে না");
  }
  await deleteDoc(doc(db, WS, workspaceId, "invoices", id));
}

/* ============================================================
   HELPERS
   ============================================================ */

async function generateInvoiceNumber(workspaceId) {
  const snap = await getDocs(col(workspaceId));
  const count = snap.size + 1;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count).padStart(4, "0")}`;
}

export function computeInvoiceTotals(items = [], discountAmount = 0, taxPct = 0) {
  const subtotal = items.reduce((sum, it) => {
    return sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
  }, 0);

  const afterDiscount = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const taxAmount = (afterDiscount * (Number(taxPct) || 0)) / 100;
  const grandTotal = afterDiscount + taxAmount;

  return {
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(Number(discountAmount) || 0),
    taxAmount: Math.round(taxAmount),
    grandTotal: Math.round(grandTotal),
  };
}

function sanitizeInvoice(input = {}, { partial = false } = {}) {
  const out = {};
  if ("invoiceNumber" in input) out.invoiceNumber = String(input.invoiceNumber || "").trim();
  if ("customerId" in input) out.customerId = input.customerId || null;
  if ("customerName" in input) out.customerName = String(input.customerName || "").trim();
  if ("customerPhone" in input) out.customerPhone = String(input.customerPhone || "").trim();
  if ("customerEmail" in input) out.customerEmail = String(input.customerEmail || "").trim();
  if ("customerAddress" in input) out.customerAddress = String(input.customerAddress || "");
  if ("items" in input) out.items = Array.isArray(input.items) ? input.items : [];
  if ("subtotal" in input) out.subtotal = Number(input.subtotal) || 0;
  if ("discountAmount" in input) out.discountAmount = Number(input.discountAmount) || 0;
  if ("taxPct" in input) out.taxPct = Number(input.taxPct) || 0;
  if ("taxAmount" in input) out.taxAmount = Number(input.taxAmount) || 0;
  if ("grandTotal" in input) out.grandTotal = Number(input.grandTotal) || 0;
  if ("amountPaid" in input) out.amountPaid = Number(input.amountPaid) || 0;
  if ("paymentStatus" in input) out.paymentStatus = input.paymentStatus || "unpaid";
  if ("note" in input) out.note = String(input.note || "");
  if ("date" in input) out.date = input.date || new Date().toISOString().slice(0, 10);
  if (!partial) {
    out.items = out.items || [];
    out.paymentStatus = out.paymentStatus || "unpaid";
    out.date = out.date || new Date().toISOString().slice(0, 10);
  }
  return out;
}