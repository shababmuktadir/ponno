import {
  addDoc, collection, getDocs, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const WS = "workspaces";

/**
 * Aggregates data for various report types.
 * Returns a normalized structure used by ReportTemplate.
 */

export async function generateReport(workspaceId, params) {
  const {
    type = "sales",         // sales | stock | income | customer | product
    from,
    to,
  } = params || {};

  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");

  const fromMs = from ? new Date(from).getTime() : null;
  const toMs = to ? new Date(to).getTime() + 86399999 : null;

  const [txSnap, prodSnap, custSnap, catSnap] = await Promise.all([
    getDocs(collection(db, WS, workspaceId, "stockTransactions")),
    getDocs(collection(db, WS, workspaceId, "products")),
    getDocs(collection(db, WS, workspaceId, "customers")),
    getDocs(collection(db, WS, workspaceId, "categories")),
  ]);

  const txs = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const customers = custSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const inRange = (t) => {
    const ms = t.date?.seconds ? t.date.seconds * 1000 : 0;
    if (fromMs && ms < fromMs) return false;
    if (toMs && ms > toMs) return false;
    return true;
  };

  const filteredTxs = txs.filter(inRange);

  const reports = {
    sales: buildSalesReport(filteredTxs),
    stock: buildStockReport(products, categories, filteredTxs),
    income: buildIncomeReport(filteredTxs),
    customer: buildCustomerReport(customers),
    product: buildProductReport(products, filteredTxs),
  };

  return {
    type,
    from: from || null,
    to: to || null,
    generatedAt: new Date(),
    sales: reports.sales,
    stock: reports.stock,
    income: reports.income,
    customer: reports.customer,
    product: reports.product,
    summary: reports[type] || reports.sales,
  };
}

export async function saveReportLog(workspaceId, userId, payload) {
  if (!workspaceId || !userId) return;
  try {
    await addDoc(collection(db, WS, workspaceId, "reports"), {
      ...payload,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch {}
}

/* ============================================================
   BUILDERS
   ============================================================ */

function buildSalesReport(txs) {
  const sales = txs.filter((t) => t.type === "sale");
  const purchases = txs.filter((t) => t.type === "purchase");

  const totalSales = sales.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
  const totalPurchases = purchases.reduce(
    (s, t) => s + (Number(t.totalAmount) || 0),
    0
  );
  const totalQtySold = sales.reduce((s, t) => s + (Number(t.quantity) || 0), 0);
  const totalQtyBought = purchases.reduce(
    (s, t) => s + (Number(t.quantity) || 0),
    0
  );

  return {
    title: "বিক্রয় রিপোর্ট",
    rows: sales.map((t) => ({
      date: t.date,
      productName: t.productName || "",
      model: t.productModel || "",
      qty: Number(t.quantity) || 0,
      unitPrice: Number(t.unitPrice) || 0,
      total: Number(t.totalAmount) || 0,
      customerName: t.customerName || "",
      note: t.note || "",
    })),
    totals: {
      totalSales,
      totalPurchases,
      totalQtySold,
      totalQtyBought,
      count: sales.length,
    },
  };
}

function buildStockReport(products, categories, txs) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const rows = products.map((p) => {
    const productTxs = txs.filter((t) => t.productId === p.id);
    const bought = productTxs
      .filter((t) => t.type === "purchase")
      .reduce((s, t) => s + (Number(t.quantity) || 0), 0);
    const sold = productTxs
      .filter((t) => t.type === "sale")
      .reduce((s, t) => s + (Number(t.quantity) || 0), 0);

    return {
      productName: p.name,
      model: p.model || "",
      categoryName: catMap[p.categoryId] || p.categoryNameSnapshot || "—",
      currentStock: Number(p.currentStock) || 0,
      buyPrice: Number(p.buyUnitPrice) || 0,
      sellPrice: Number(p.sellUnitPrice) || 0,
      stockValue: (Number(p.currentStock) || 0) * (Number(p.buyUnitPrice) || 0),
      totalBought: bought,
      totalSold: sold,
    };
  });

  const totalStock = rows.reduce((s, r) => s + r.currentStock, 0);
  const totalValue = rows.reduce((s, r) => s + r.stockValue, 0);
  const lowStock = rows.filter((r) => r.currentStock > 0 && r.currentStock < 5).length;
  const outOfStock = rows.filter((r) => r.currentStock <= 0).length;

  return {
    title: "স্টক রিপোর্ট",
    rows,
    totals: {
      totalStock,
      totalValue,
      lowStock,
      outOfStock,
      count: rows.length,
    },
  };
}

function buildIncomeReport(txs) {
  const sales = txs.filter((t) => t.type === "sale");
  const purchases = txs.filter((t) => t.type === "purchase");

  const totalSales = sales.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
  const totalPurchases = purchases.reduce(
    (s, t) => s + (Number(t.totalAmount) || 0),
    0
  );
  const profit = totalSales - totalPurchases;

  return {
    title: "আয় রিপোর্ট",
    rows: [
      { label: "মোট বিক্রয়", value: totalSales },
      { label: "মোট ক্রয়", value: totalPurchases },
      { label: "মোট মুনাফা", value: profit },
      { label: "লেনদেন সংখ্যা", value: txs.length },
      { label: "বিক্রয় সংখ্যা", value: sales.length },
      { label: "ক্রয় সংখ্যা", value: purchases.length },
    ],
    totals: {
      totalSales,
      totalPurchases,
      profit,
      count: txs.length,
    },
  };
}

function buildCustomerReport(customers) {
  return {
    title: "কাস্টমার রিপোর্ট",
    rows: customers.map((c) => ({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      balance: Number(c.balance) || 0,
      createdAt: c.createdAt,
    })),
    totals: {
      count: customers.length,
      totalBalance: customers.reduce((s, c) => s + (Number(c.balance) || 0), 0),
    },
  };
}

function buildProductReport(products, txs) {
  const rows = products.map((p) => {
    const pTxs = txs.filter((t) => t.productId === p.id);
    const sold = pTxs
      .filter((t) => t.type === "sale")
      .reduce((s, t) => s + (Number(t.quantity) || 0), 0);
    const revenue = pTxs
      .filter((t) => t.type === "sale")
      .reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
    return {
      productName: p.name,
      model: p.model || "",
      categoryName: p.categoryNameSnapshot || "",
      currentStock: Number(p.currentStock) || 0,
      sellPrice: Number(p.sellUnitPrice) || 0,
      totalSold: sold,
      revenue,
    };
  });

  return {
    title: "প্রোডাক্ট রিপোর্ট",
    rows,
    totals: {
      count: rows.length,
      totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
      totalSold: rows.reduce((s, r) => s + r.totalSold, 0),
    },
  };
}