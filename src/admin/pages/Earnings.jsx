import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, TrendingUp, Calendar, Package } from "lucide-react";
import { listSubscriptions, listPackages } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, StatCard, TableEmpty } from "@/admin/components/AdminUI";

export default function Earnings() {
  const [subs, setSubs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([listSubscriptions(), listPackages()]);
        setSubs(s);
        setPackages(p);
      } catch (err) { toast.error(getErrorMessage(err)); }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const getAmt = (s) => Number(s.price) || Number(s.amountPaid) || 0;
    const getTime = (s) => s.createdAt?.seconds ? s.createdAt.seconds * 1000 : 0;

    const total = subs.reduce((sum, s) => sum + getAmt(s), 0);
    const month = subs.filter((s) => getTime(s) >= monthStart).reduce((sum, s) => sum + getAmt(s), 0);
    const day = subs.filter((s) => getTime(s) >= dayStart).reduce((sum, s) => sum + getAmt(s), 0);

    const byPkg = {};
    subs.forEach((s) => {
      const key = s.packageId || "unknown";
      byPkg[key] = (byPkg[key] || 0) + getAmt(s);
    });

    return { total, month, day, byPkg };
  }, [subs]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="আর্নিং"
        subtitle="প্ল্যাটফর্মের সম্পূর্ণ রেভিনিউ পরিসংখ্যান।"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="মোট রেভিনিউ" value={stats.total} money icon={Wallet} tone="accent" />
        <StatCard label="এই মাসে" value={stats.month} money icon={Calendar} tone="success" />
        <StatCard label="আজ" value={stats.day} money icon={TrendingUp} tone="ink" />
      </div>

      <Card variant="glass" className="p-5">
        <h2 className="text-sm font-semibold text-ink">প্যাকেজ অনুযায়ী আয়</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">লোড হচ্ছে…</p>
        ) : Object.keys(stats.byPkg).length === 0 ? (
          <EmptyState icon={Package} title="এখনো কোনো আয় নেই" description="ইউজার প্যাকেজ কিনলে এখানে দেখা যাবে।" />
        ) : (
          <div className="mt-4 space-y-2">
            {Object.entries(stats.byPkg).map(([k, v]) => {
              const p = packages.find((pkg) => pkg.id === k);
              const label = p?.name || (k === "free" ? "ফ্রি" : k);
              return (
                <div key={k} className="flex items-center justify-between rounded-[12px] border border-line bg-surface/50 px-4 py-3">
                  <span className="text-sm text-ink">{label}</span>
                  <span className="text-sm font-medium text-ink">{formatTaka(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">সাম্প্রতিক সাবস্ক্রিপশন</h2>
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">ইউজার</th>
                  <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                  <th className="px-4 py-3 font-medium">মূল্য</th>
                  <th className="px-4 py-3 font-medium">তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {subs.slice(0, 20).length === 0 ? (
                  <TableEmpty colSpan={4} />
                ) : subs.slice(0, 20).map((s) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3 text-xs text-muted"><code>{s.userId}</code></td>
                    <td className="px-4 py-3 text-ink">{s.packageId}</td>
                    <td className="px-4 py-3 text-ink">{formatTaka(s.price || s.amountPaid || 0)}</td>
                    <td className="px-4 py-3 text-muted">{toBanglaDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}