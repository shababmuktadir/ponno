import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Wallet, TrendingUp, Calendar, Trash2, RefreshCw, BarChart3,
  Package, Users, Clock, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";

import {
  watchRenewals, deleteAllRenewals, aggregateRenewals,
} from "@/services/firebase/renewalService";
import { useAuth } from "@/context/AuthContext";
import { usePaletteColors } from "@/context/PaletteContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate, toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, TableEmpty } from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const BILLING_LABEL = {
  monthly: "মাসিক",
  yearly: "বার্ষিক",
  fiveYear: "৫ বছর",
  custom: "কাস্টম",
};

export default function AdminEarnings() {
  const { profile } = useAuth();
  const colors = usePaletteColors();

  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [tab, setTab] = useState("overview");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const unsub = watchRenewals((list) => {
      setRenewals(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => aggregateRenewals(renewals), [renewals]);

  /* Monthly chart data — last 12 months */
  const chartData = useMemo(() => {
    const now = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("bn-BD", {
        month: "short",
        year: "2-digit",
      });
      out.push({
        month: key,
        label,
        amount: stats.byMonth[key] || 0,
      });
    }
    return out;
  }, [stats.byMonth]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const count = await deleteAllRenewals();
      toast.success(`${toBanglaNumber(count)}টি renewal মুছে ফেলা হয়েছে`);
      setConfirmClear(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="প্ল্যাটফর্ম আর্নিং"
        subtitle="সাবস্ক্রিপশন রিনিউ থেকে রেভিনিউ ট্র্যাকিং।"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmClear(true)}
              disabled={renewals.length === 0}
              className="text-danger"
            >
              <Trash2 className="h-4 w-4" />
              ডেটা ক্লিয়ার
            </Button>
          </>
        }
      />

      {/* === Stats === */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox
          label="মোট আয়"
          value={formatTaka(stats.total)}
          icon={Wallet}
          tone="accent"
        />
        <StatBox
          label="এই মাসে"
          value={formatTaka(stats.thisMonth)}
          icon={Calendar}
          tone="success"
        />
        <StatBox
          label="এই বছরে"
          value={formatTaka(stats.thisYear)}
          icon={TrendingUp}
          tone="ink"
        />
        <StatBox
          label="মোট রিনিউ"
          value={toBanglaNumber(stats.count)}
          icon={RefreshCw}
          tone="muted"
        />
      </div>

      {/* === Billing breakdown === */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="মাসিক রিনিউ" value={stats.monthlyCount} />
        <MiniStat label="বার্ষিক রিনিউ" value={stats.yearlyCount} />
        <MiniStat label="৫ বছর রিনিউ" value={stats.fiveYearCount} />
      </div>

      {/* === Tabs === */}
      <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
        {[
          { v: "overview", l: "ওভারভিউ" },
          { v: "monthly", l: "মাস অনুযায়ী" },
          { v: "yearly", l: "বছর অনুযায়ী" },
          { v: "list", l: "সব রিনিউ" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={cn(
              "flex-1 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
              tab === t.v
                ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                : "text-muted hover:text-ink"
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* === Overview chart === */}
      {tab === "overview" && (
        <Card variant="glass" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-strong" />
            <h2 className="text-sm font-semibold text-ink">
              শেষ ১২ মাসের আয়
            </h2>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded-[12px] bg-surface-2" />
          ) : renewals.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="কোনো রিনিউ নেই"
              description="ইউজার সাবস্ক্রিপশন রিনিউ করলে এখানে দেখাবে"
            />
          ) : (
            <div className="h-64">
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
                    dataKey="label"
                    tick={{ fontSize: 10, fill: colors.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: colors.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill={colors.accent}
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Package breakdown */}
          {Object.keys(stats.byPackage).length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="label-xs mb-2">প্যাকেজ অনুযায়ী</p>
              <div className="space-y-2">
                {Object.entries(stats.byPackage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, amt]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-[10px] border border-line bg-surface/50 px-3 py-2 text-sm"
                    >
                      <span className="text-ink">{name}</span>
                      <span className="font-medium text-ink">
                        {formatTaka(amt)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* === Monthly === */}
      {tab === "monthly" && (
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">মাস</th>
                  <th className="px-4 py-3 font-medium">মোট আয়</th>
                  <th className="px-4 py-3 font-medium">সংখ্যা</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(stats.byMonth).length === 0 ? (
                  <TableEmpty colSpan={3} />
                ) : (
                  Object.entries(stats.byMonth)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([key, amt]) => {
                      const count = renewals.filter((r) => {
                        const ms = r.createdAt?.seconds
                          ? r.createdAt.seconds * 1000
                          : 0;
                        if (!ms) return false;
                        const d = new Date(ms);
                        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                        return k === key;
                      }).length;
                      const [y, m] = key.split("-");
                      return (
                        <tr
                          key={key}
                          className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                        >
                          <td className="px-4 py-3 text-ink">
                            {m}/{y}
                          </td>
                          <td className="px-4 py-3 text-ink font-medium">
                            {formatTaka(amt)}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {toBanglaNumber(count)}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* === Yearly === */}
      {tab === "yearly" && (
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">বছর</th>
                  <th className="px-4 py-3 font-medium">মোট আয়</th>
                  <th className="px-4 py-3 font-medium">সংখ্যা</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(stats.byYear).length === 0 ? (
                  <TableEmpty colSpan={3} />
                ) : (
                  Object.entries(stats.byYear)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([year, amt]) => {
                      const count = renewals.filter((r) => {
                        const ms = r.createdAt?.seconds
                          ? r.createdAt.seconds * 1000
                          : 0;
                        if (!ms) return false;
                        return new Date(ms).getFullYear() === Number(year);
                      }).length;
                      return (
                        <tr
                          key={year}
                          className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                        >
                          <td className="px-4 py-3 text-ink">{year}</td>
                          <td className="px-4 py-3 text-ink font-medium">
                            {formatTaka(amt)}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {toBanglaNumber(count)}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* === Full list === */}
      {tab === "list" && (
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">তারিখ</th>
                  <th className="px-4 py-3 font-medium">ইউজার</th>
                  <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                  <th className="px-4 py-3 font-medium">বিলিং</th>
                  <th className="px-4 py-3 font-medium">পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                {renewals.length === 0 ? (
                  <TableEmpty colSpan={5} />
                ) : (
                  renewals.slice(0, 200).map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {toBanglaDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-ink">
                          {r.userName || "—"}
                        </p>
                        <p className="truncate text-[10px] text-muted">
                          {r.userEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {r.packageName || r.packageId}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {BILLING_LABEL[r.billingPeriod] || r.billingPeriod}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {formatTaka(r.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* === Clear confirmation === */}
      {confirmClear && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmClear(false)}
          />
          <div className="glass-strong relative w-full max-w-sm rounded-[20px] p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <h3 className="text-base font-semibold text-ink">
                সব ডেটা ক্লিয়ার করবেন?
              </h3>
            </div>
            <p className="mt-2 text-sm text-muted">
              {toBanglaNumber(renewals.length)}টি renewal মুছে যাবে। এটি
              ফিরিয়ে আনা যাবে না।
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmClear(false)}
              >
                বাতিল
              </Button>
              <Button
                variant="danger"
                onClick={handleClear}
                loading={clearing}
              >
                <Trash2 className="h-4 w-4" />
                ক্লিয়ার
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------- Sub components -------- */

function StatBox({ label, value, icon: Icon, tone = "ink" }) {
  const toneCls =
    tone === "accent"
      ? "bg-accent/25 text-accent-fg"
      : tone === "success"
      ? "bg-success/15 text-success"
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
        <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      </Card>
    </motion.div>
  );
}

function MiniStat({ label, value }) {
  return (
    <Card variant="glass" className="p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-ink">
        {toBanglaNumber(value)}
      </p>
    </Card>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-[10px] px-3 py-2 text-xs">
      <p className="font-medium text-ink">{formatTaka(payload[0].value)}</p>
    </div>
  );
}