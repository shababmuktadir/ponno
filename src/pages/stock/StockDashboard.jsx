import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes, AlertTriangle, XCircle, Wallet, Package, TrendingUp,
  TrendingDown, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import toast from "react-hot-toast";

import useProducts from "@/hooks/useProducts";
import usePermission from "@/hooks/usePermission";
import { usePaletteColors } from "@/context/PaletteContext";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

export default function StockDashboard() {
  const { canPage } = usePermission();
  const { products, loading, reload } = useProducts();
  const colors = usePaletteColors();

  const pageAllowed = canPage("stockDashboard");

  const stats = useMemo(() => {
    const totalStock = products.reduce(
      (s, p) => s + (Number(p.currentStock) || 0),
      0
    );
    const stockValue = products.reduce(
      (s, p) =>
        s +
        (Number(p.currentStock) || 0) * (Number(p.buyUnitPrice) || 0),
      0
    );
    const totalProducts = products.length;
    const lowStock = products.filter(
      (p) => (Number(p.currentStock) || 0) > 0 && (Number(p.currentStock) || 0) < 5
    ).length;
    const outOfStock = products.filter(
      (p) => (Number(p.currentStock) || 0) <= 0
    ).length;
    return { totalStock, stockValue, totalProducts, lowStock, outOfStock };
  }, [products]);

  const chartData = useMemo(() => {
    return products
      .map((p) => ({
        name: (p.name || "").slice(0, 12),
        stock: Number(p.currentStock) || 0,
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10);
  }, [products]);

  const lowStockList = useMemo(
    () =>
      products
        .filter((p) => (Number(p.currentStock) || 0) < 5)
        .sort(
          (a, b) => (Number(a.currentStock) || 0) - (Number(b.currentStock) || 0)
        )
        .slice(0, 10),
    [products]
  );

  if (!pageAllowed) return <UpgradePrompt pageId="stockDashboard" />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            স্টক ড্যাশবোর্ড
          </h1>
          <p className="mt-1 text-sm text-muted">
            সম্পূর্ণ স্টকের সারসংক্ষেপ
          </p>
        </div>
        <Button variant="secondary" onClick={reload}>
          <RefreshCw className="h-4 w-4" />
          রিফ্রেশ
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatBox
          label="মোট স্টক"
          value={loading ? "…" : toBanglaNumber(stats.totalStock)}
          icon={Boxes}
        />
        <StatBox
          label="স্টক মূল্য"
          value={loading ? "…" : formatTaka(stats.stockValue)}
          icon={Wallet}
          tone="accent"
        />
        <StatBox
          label="মোট প্রোডাক্ট"
          value={loading ? "…" : toBanglaNumber(stats.totalProducts)}
          icon={Package}
        />
        <StatBox
          label="কম স্টক"
          value={loading ? "…" : toBanglaNumber(stats.lowStock)}
          icon={AlertTriangle}
          tone={stats.lowStock > 0 ? "warning" : "ink"}
        />
        <StatBox
          label="স্টক নেই"
          value={loading ? "…" : toBanglaNumber(stats.outOfStock)}
          icon={XCircle}
          tone={stats.outOfStock > 0 ? "danger" : "ink"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="glass" className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-strong" />
            <h2 className="text-sm font-semibold text-ink">
              টপ ১০ প্রোডাক্ট (স্টক অনুযায়ী)
            </h2>
          </div>
          {loading ? (
            <div className="h-56 animate-pulse rounded-[12px] bg-surface-2" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="কোনো ডেটা নেই"
              description="প্রোডাক্ট যোগ করলে এখানে দেখাবে"
            />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 6"
                    stroke={colors.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: colors.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: colors.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip content={<BTooltip />} />
                  <Bar
                    dataKey="stock"
                    fill={colors.accent}
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card variant="glass" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-ink">
              কম স্টকের প্রোডাক্ট
            </h2>
          </div>
          {loading ? (
            <p className="py-4 text-center text-sm text-muted">লোড হচ্ছে…</p>
          ) : lowStockList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              সব প্রোডাক্টের স্টক ঠিক আছে
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-[10px] border border-line bg-surface/50 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{p.name}</p>
                    <p className="truncate text-[10px] text-muted">
                      {p.model || "—"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      (Number(p.currentStock) || 0) <= 0
                        ? "border-danger/40 bg-danger/10 text-danger"
                        : "border-warning/40 bg-warning/10 text-warning"
                    )}
                  >
                    {toBanglaNumber(p.currentStock || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, tone = "ink" }) {
  const toneCls =
    tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "danger"
      ? "bg-danger/15 text-danger"
      : tone === "accent"
      ? "bg-accent/25 text-accent-fg"
      : "bg-ink text-bg dark:bg-accent dark:text-accent-fg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass" className="p-4">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[10px]",
            toneCls
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 text-[10px] uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      </Card>
    </motion.div>
  );
}

function BTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-[10px] px-3 py-2 text-xs">
      <p className="font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-muted">
        স্টক: {toBanglaNumber(payload[0].value)}
      </p>
    </div>
  );
}