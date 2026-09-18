import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Package, RefreshCw,
  BarChart3, PieChart as PieIcon,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import toast from "react-hot-toast";

import {
  getEarningsSummary, getProductBreakdown, getCategoryBreakdown,
  getEarningsSeries,
} from "@/services/firebase/earningService";
import usePermission from "@/hooks/usePermission";
import { usePaletteColors } from "@/context/PaletteContext";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const RANGES = [
  { id: 7, label: "৭ দিন" },
  { id: 30, label: "৩০ দিন" },
  { id: 90, label: "৯০ দিন" },
];

export default function Earnings() {
  const { canPage } = usePermission();
  const { workspaceId } = useAuth();
  const colors = usePaletteColors();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState("overview");

  const pageAllowed = canPage("income");

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [s, pb, cb, sr] = await Promise.all([
        getEarningsSummary(workspaceId, {}),
        getProductBreakdown(workspaceId, { max: 100 }),
        getCategoryBreakdown(workspaceId),
        getEarningsSeries(workspaceId, { days }),
      ]);
      setSummary(s);
      setProducts(pb);
      setCategories(cb);
      setSeries(sr);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, days]);

  if (!pageAllowed) return <UpgradePrompt pageId="income" />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            আয়
          </h1>
          <p className="mt-1 text-sm text-muted">
            বিক্রয়, ক্রয়, লাভ ও ক্ষতির হিসাব
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SumBox
          label="মোট বিক্রয়"
          value={loading ? "…" : formatTaka(summary?.totalSales || 0)}
          icon={DollarSign}
          tone="accent"
        />
        <SumBox
          label="মোট ক্রয়"
          value={loading ? "…" : formatTaka(summary?.totalPurchases || 0)}
          icon={Wallet}
        />
        <SumBox
          label="COGS"
          value={loading ? "…" : formatTaka(summary?.cogs || 0)}
          icon={Package}
          tone="muted"
        />
        <SumBox
          label="মোট মুনাফা"
          value={loading ? "…" : formatTaka(summary?.grossProfit || 0)}
          icon={TrendingUp}
          tone="success"
        />
        <SumBox
          label="মোট ক্ষতি"
          value={loading ? "…" : formatTaka(summary?.grossLoss || 0)}
          icon={TrendingDown}
          tone={summary?.grossLoss > 0 ? "danger" : "muted"}
        />
      </div>

      {/* Net profit banner */}
      <Card
        variant="glass"
        className={cn(
          "p-5",
          (summary?.netProfit || 0) >= 0
            ? "border-success/40 bg-success/5"
            : "border-danger/40 bg-danger/5"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">
              মোট লাভ (বিক্রয় − COGS)
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold",
                (summary?.netProfit || 0) >= 0 ? "text-success" : "text-danger"
              )}
            >
              {loading ? "…" : formatTaka(summary?.netProfit || 0)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted">বিক্রি পরিমাণ</p>
              <p className="mt-0.5 font-semibold text-ink">
                {toBanglaNumber(summary?.totalQuantitySold || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted">ক্রয় পরিমাণ</p>
              <p className="mt-0.5 font-semibold text-ink">
                {toBanglaNumber(summary?.totalQuantityBought || 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
        {[
          { id: "overview", l: "সারসংক্ষেপ" },
          { id: "products", l: "প্রোডাক্ট" },
          { id: "categories", l: "ক্যাটাগরি" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                : "text-muted hover:text-ink"
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <Card variant="glass" className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent-strong" />
              <h2 className="text-sm font-semibold text-ink">
                দৈনিক বিক্রয় ও ক্রয়
              </h2>
            </div>
            <div className="flex gap-1 rounded-[10px] border border-line bg-surface/60 p-1">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDays(r.id)}
                  className={cn(
                    "rounded-[8px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                    days === r.id
                      ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded-[12px] bg-surface-2" />
          ) : series.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="কোনো ট্রানজেকশন নেই"
              description="স্টক ক্রয় বা বিক্রয় যোগ করলে এখানে দেখাবে"
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={series}
                  margin={{ top: 4, right: 8, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="salesGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={colors.accent}
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="purchasesGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={colors.accent3}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.accent3}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 6"
                    stroke={colors.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: colors.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v || "").slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: colors.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip content={<ETooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={colors.accent}
                    strokeWidth={2}
                    fill="url(#salesGrad)"
                    animationDuration={600}
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    stroke={colors.accent3}
                    strokeWidth={2}
                    fill="url(#purchasesGrad)"
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* Products tab */}
      {tab === "products" && (
        <Card variant="glass" className="overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted">
              লোড হচ্ছে…
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="প্রোডাক্ট ডেটা নেই"
              description="স্টক লেনদেন যোগ করুন"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                    <th className="px-4 py-3 font-medium">বিক্রি</th>
                    <th className="px-4 py-3 font-medium">আয়</th>
                    <th className="px-4 py-3 font-medium">COGS</th>
                    <th className="px-4 py-3 font-medium">মুনাফা</th>
                    <th className="px-4 py-3 font-medium">মার্জিন</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.productId}
                      className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3">
                        <p className="truncate text-ink">{p.productName}</p>
                        <p className="truncate text-[10px] text-muted">
                          {p.model}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {toBanglaNumber(p.qtySold)}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {formatTaka(p.revenue)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatTaka(p.cogs)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 font-medium",
                          p.profit >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {formatTaka(p.profit)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {toBanglaNumber(Math.round(p.profitMargin))}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Categories tab */}
      {tab === "categories" && (
        <Card variant="glass" className="overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted">
              লোড হচ্ছে…
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={PieIcon}
              title="ক্যাটাগরি ডেটা নেই"
              description="স্টক লেনদেন যোগ করুন"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                    <th className="px-4 py-3 font-medium">ক্রয়</th>
                    <th className="px-4 py-3 font-medium">বিক্রয়</th>
                    <th className="px-4 py-3 font-medium">মুনাফা</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr
                      key={c.categoryId}
                      className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3 text-ink">{c.categoryName}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatTaka(c.purchases)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatTaka(c.sales)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 font-medium",
                          c.profit >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {formatTaka(c.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function SumBox({ label, value, icon: Icon, tone = "ink" }) {
  const toneCls =
    tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "danger"
      ? "bg-danger/15 text-danger"
      : tone === "success"
      ? "bg-success/15 text-success"
      : tone === "accent"
      ? "bg-accent/25 text-accent-fg"
      : tone === "muted"
      ? "bg-surface-2 text-muted"
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
        <p className="mt-1 text-base font-semibold text-ink">{value}</p>
      </Card>
    </motion.div>
  );
}

function ETooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-[10px] px-3 py-2 text-xs">
      <p className="font-medium text-ink">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5" style={{ color: p.color }}>
          {p.name === "sales" ? "বিক্রয়" : "ক্রয়"}: {formatTaka(p.value)}
        </p>
      ))}
    </div>
  );
}