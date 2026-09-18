// src/admin/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, UserCheck, CreditCard, Package, Wallet, Activity,
  ShieldAlert, Bell, TrendingUp, UserCog,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDashboardStats } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import { AdminPageHeader, StatCard } from "@/admin/components/AdminUI";
import Card from "@/components/ui/Card";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const s = await getDashboardStats();
        if (!cancel) setStats(s);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const v = (val) => (loading ? "…" : val);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="অ্যাডমিন ড্যাশবোর্ড"
        subtitle="প্ল্যাটফর্মের সার্বিক অবস্থা এক নজরে।"
      />

      {/* ---------- Stat cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="মোট ইউজার"
          value={v(stats?.totalUsers ?? 0)}
          icon={Users}
          tone="ink"
        />
        <StatCard
          label="ফ্রি ইউজার"
          value={v(stats?.freeUsers ?? 0)}
          icon={Users}
          tone="ink"
        />
        <StatCard
          label="পেইড ইউজার"
          value={v(stats?.paidUsers ?? 0)}
          icon={CreditCard}
          tone="accent"
        />
        <StatCard
          label="পেন্ডিং"
          value={v(stats?.pending ?? 0)}
          icon={UserCheck}
          tone="warning"
        />
        <StatCard
          label="নিষ্ক্রিয়"
          value={v(stats?.suspended ?? 0)}
          icon={ShieldAlert}
          tone="danger"
        />
        <StatCard
          label="স্টাফ"
          value={v(stats?.staffUsers ?? 0)}
          icon={UserCog}
          tone="accent"
        />
        <StatCard
          label="সক্রিয় সাবস্ক্রিপশন"
          value={v(stats?.activeSubs ?? 0)}
          icon={CreditCard}
          tone="success"
        />
        <StatCard
          label="মোট প্যাকেজ"
          value={v(stats?.totalPackages ?? 0)}
          icon={Package}
          tone="ink"
        />
        <StatCard
          label="মোট রেভিনিউ"
          value={v(stats?.totalRevenue ?? 0)}
          money={true}
          icon={Wallet}
          tone="accent"
        />
        <StatCard
          label="এই মাসের রেভিনিউ"
          value={v(stats?.monthRevenue ?? 0)}
          money={true}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="নোটিফিকেশন"
          value={v(stats?.totalNotifications ?? 0)}
          icon={Bell}
          tone="ink"
        />
        <StatCard
          label="মোট প্রোডাক্ট"
          value="—"
          icon={Activity}
          tone="ink"
        />
      </div>

      {/* ---------- Quick guide + Distribution ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Quick guide */}
        <Card variant="glass" className="p-5">
          <h2 className="text-sm font-semibold text-ink">দ্রুত নির্দেশনা</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted">
            <li>
              ১.{" "}
              <Link
                to="/admin/pending-users"
                className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                পেন্ডিং ইউজার
              </Link>{" "}
              → পেইড অ্যাকাউন্ট আবেদন অনুমোদন করুন।
            </li>
            <li>
              ২.{" "}
              <Link
                to="/admin/packages"
                className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                প্যাকেজ
              </Link>{" "}
              → মূল্য, সীমা ও ফিচার নির্ধারণ করুন।
            </li>
            <li>
              ৩.{" "}
              <Link
                to="/admin/subscriptions"
                className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                সাবস্ক্রিপশন
              </Link>{" "}
              → ইউজারকে প্যাকেজ অ্যাসাইন করুন।
            </li>
            <li>
              ৪.{" "}
              <Link
                to="/admin/staff"
                className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                স্টাফ ম্যানেজ
              </Link>{" "}
              → নতুন মডারেটর/এডিটর যোগ করুন।
            </li>
          </ol>
        </Card>

        {/* Distribution */}
        <Card variant="glass" className="p-5">
          <h2 className="text-sm font-semibold text-ink">প্যাকেজ ডিস্ট্রিবিউশন</h2>

          <div className="mt-3 space-y-3">
            {[
              {
                label: "ফ্রি ইউজার",
                value: stats?.freeUsers || 0,
                total: stats?.totalUsers || 1,
                color: "bg-line-strong",
              },
              {
                label: "পেইড ইউজার",
                value: stats?.paidUsers || 0,
                total: stats?.totalUsers || 1,
                color: "bg-accent-strong",
              },
              {
                label: "স্টাফ",
                value: stats?.staffUsers || 0,
                total: stats?.totalUsers || 1,
                color: "bg-danger/70",
              },
            ].map((r) => {
              const pct = Math.min(
                100,
                Math.round((r.value / Math.max(1, r.total)) * 100)
              );
              return (
                <div key={r.label}>
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>{r.label}</span>
                    <span>
                      {toBanglaNumber(r.value)} / {toBanglaNumber(r.total)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${r.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[12px] border border-line bg-surface/50 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                মোট রেভিনিউ
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatTaka(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="rounded-[12px] border border-line bg-surface/50 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                এই মাসে
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatTaka(stats?.monthRevenue || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}