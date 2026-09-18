import { collection, getDocs, limit as qLimit, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { TX_TYPES } from "./stockService";

const WS = "workspaces";

/* ============================================================
   SUMMARY — total purchase, sale, profit, loss
   ============================================================ */

export async function getEarningsSummary(workspaceId, { from, to } = {}) {
  if (!workspaceId) {
    return {
      totalSales: 0,
      totalPurchases: 0,
      grossProfit: 0,
      grossLoss: 0,
      netProfit: 0,
      totalQuantitySold: 0,
      totalQuantityBought: 0,
      txCount: 0,
    };
  }

  const snap = await getDocs(collection(db, WS, workspaceId, "stockTransactions"));
  let txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (from) {
    const fromMs = new Date(from).getTime();
    txs = txs.filter((t) => {
      const ms = t.date?.seconds ? t.date.seconds * 1000 : 0;
      return ms >= fromMs;
    });
  }
  if (to) {
    const toMs = new Date(to).getTime();
    txs = txs.filter((t) => {
      const ms = t.date?.seconds ? t.date.seconds * 1000 : 0;
      return ms <= toMs;
    });
  }

  let totalSales = 0;
  let totalPurchases = 0;
  let totalQuantitySold = 0;
  let totalQuantityBought = 0;

  // For gross profit, need cost of goods sold
  // COGS = quantity sold * weighted avg purchase price at time of sale
  // Simplified: qty * latest known avg buy price of that product
  // This is approximate but deterministic.

  // Precompute product buy-prices from all purchases
  const productBuySum = {};
  const productBuyQty = {};

  txs.forEach((t) => {
    const q = Number(t.quantity) || 0;
    const p = Number(t.unitPrice) || 0;
    if (t.type === TX_TYPES.PURCHASE) {
      productBuySum[t.productId] = (productBuySum[t.productId] || 0) + q * p;
      productBuyQty[t.productId] = (productBuyQty[t.productId] || 0) + q;
    }
  });

  txs.forEach((t) => {
    const q = Number(t.quantity) || 0;
    const total = Number(t.totalAmount) || q * (Number(t.unitPrice) || 0);

    if (t.type === TX_TYPES.PURCHASE) {
      totalPurchases += total;
      totalQuantityBought += q;
    } else if (t.type === TX_TYPES.SALE) {
      totalSales += total;
      totalQuantitySold += q;
    }
  });

  // COGS from sales
  let cogs = 0;
  txs
    .filter((t) => t.type === TX_TYPES.SALE)
    .forEach((t) => {
      const q = Number(t.quantity) || 0;
      const avgBuy =
        productBuyQty[t.productId] > 0
          ? productBuySum[t.productId] / productBuyQty[t.productId]
          : 0;
      cogs += q * avgBuy;
    });

  const grossProfit = Math.max(0, totalSales - cogs);
  const grossLoss = Math.max(0, cogs - totalSales);
  const netProfit = totalSales - cogs;

  return {
    totalSales,
    totalPurchases,
    cogs,
    grossProfit,
    grossLoss,
    netProfit,
    totalQuantitySold,
    totalQuantityBought,
    txCount: txs.length,
  };
}

/* ============================================================
   PRODUCT-WISE BREAKDOWN
   ============================================================ */

export async function getProductBreakdown(workspaceId, { max = 200 } = {}) {
  if (!workspaceId) return [];
  const snap = await getDocs(collection(db, WS, workspaceId, "stockTransactions"));
  const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const map = {};

  txs.forEach((t) => {
    const key = t.productId || "unknown";
    if (!map[key]) {
      map[key] = {
        productId: key,
        productName: t.productName || "",
        model: t.productModel || "",
        categoryName: t.categoryNameSnapshot || "",
        qtySold: 0,
        qtyBought: 0,
        revenue: 0,
        cost: 0,
        lastSalePrice: 0,
        lastBuyPrice: 0,
      };
    }
    const q = Number(t.quantity) || 0;
    const p = Number(t.unitPrice) || 0;
    const amt = Number(t.totalAmount) || q * p;

    if (t.type === TX_TYPES.SALE) {
      map[key].qtySold += q;
      map[key].revenue += amt;
      map[key].lastSalePrice = p;
    } else if (t.type === TX_TYPES.PURCHASE) {
      map[key].qtyBought += q;
      map[key].cost += amt;
      map[key].lastBuyPrice = p;
    }
  });

  return Object.values(map)
    .map((r) => {
      const avgCost =
        r.qtyBought > 0 ? r.cost / r.qtyBought : r.lastBuyPrice || 0;
      const cogs = r.qtySold * avgCost;
      const profit = r.revenue - cogs;
      return {
        ...r,
        avgCost,
        cogs,
        profit,
        profitMargin: r.revenue > 0 ? (profit / r.revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, max);
}

/* ============================================================
   CATEGORY-WISE BREAKDOWN
   ============================================================ */

export async function getCategoryBreakdown(workspaceId) {
  if (!workspaceId) return [];
  const snap = await getDocs(collection(db, WS, workspaceId, "stockTransactions"));
  const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const map = {};

  txs.forEach((t) => {
    const key = t.categoryId || "uncategorized";
    if (!map[key]) {
      map[key] = {
        categoryId: key,
        categoryName: t.categoryNameSnapshot || "অন্যান্য",
        purchases: 0,
        sales: 0,
        qtySold: 0,
        qtyBought: 0,
      };
    }
    const q = Number(t.quantity) || 0;
    const amt = Number(t.totalAmount) || q * (Number(t.unitPrice) || 0);
    if (t.type === TX_TYPES.SALE) {
      map[key].sales += amt;
      map[key].qtySold += q;
    } else if (t.type === TX_TYPES.PURCHASE) {
      map[key].purchases += amt;
      map[key].qtyBought += q;
    }
  });

  return Object.values(map).map((r) => ({
    ...r,
    profit: r.sales - r.purchases,
  }));
}

/* ============================================================
   DAILY / MONTHLY SERIES
   ============================================================ */

export async function getEarningsSeries(workspaceId, { days = 30 } = {}) {
  if (!workspaceId) return [];
  const snap = await getDocs(collection(db, WS, workspaceId, "stockTransactions"));
  const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const now = new Date();
  const buckets = {};
  const labels = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { sales: 0, purchases: 0 };
    labels.push(key);
  }

  txs.forEach((t) => {
    const ms = t.date?.seconds ? t.date.seconds * 1000 : 0;
    if (!ms) return;
    const key = new Date(ms).toISOString().slice(0, 10);
    if (!(key in buckets)) return;
    const q = Number(t.quantity) || 0;
    const amt = Number(t.totalAmount) || q * (Number(t.unitPrice) || 0);
    if (t.type === TX_TYPES.SALE) buckets[key].sales += amt;
    else if (t.type === TX_TYPES.PURCHASE) buckets[key].purchases += amt;
  });

  return labels.map((k) => ({
    date: k,
    sales: Math.round(buckets[k].sales),
    purchases: Math.round(buckets[k].purchases),
    profit: Math.round(buckets[k].sales - buckets[k].purchases),
  }));
}