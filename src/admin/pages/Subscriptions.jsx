import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, Search, XCircle } from "lucide-react";
import {
  listSubscriptions, cancelSubscription,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import {
  AdminPageHeader, StatusBadge, TableEmpty, ConfirmDialog,
} from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

export default function Subscriptions() {
  const { profile, can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [confirm, setConfirm] = useState(null);

  const actor = { uid: profile?.uid, name: profile?.name, role: profile?.role };

  const load = async () => {
    setLoading(true);
    try {
      const list = await listSubscriptions();
      setRows(list);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !term ||
        (r.userId || "").toLowerCase().includes(term) ||
        (r.packageId || "").toLowerCase().includes(term);
      const matchS = status === "all" || r.status === status;
      return matchQ && matchS;
    });
  }, [rows, q, status]);

  const doCancel = (id) => {
    setConfirm({
      title: "সাবস্ক্রিপশন বাতিল করবেন?",
      message: "ইউজারের প্রিমিয়াম অ্যাক্সেস বন্ধ হবে।",
      danger: true,
      onConfirm: async () => {
        try {
          await cancelSubscription(id, actor);
          toast.success("বাতিল করা হয়েছে।");
          setConfirm(null);
          load();
        } catch (err) { toast.error(getErrorMessage(err)); }
      },
    });
  };

  const filters = [
    { v: "all", l: "সব" },
    { v: "active", l: "সক্রিয়" },
    { v: "expired", l: "মেয়াদোত্তীর্ণ" },
    { v: "cancelled", l: "বাতিল" },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="সাবস্ক্রিপশন ম্যানেজ"
        subtitle="সব সাবস্ক্রিপশন রেকর্ড।"
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="ইউজার আইডি বা প্যাকেজ…"
            value={q} onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
          {filters.map((s) => (
            <button key={s.v} onClick={() => setStatus(s.v)}
              className={cn(
                "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors",
                status === s.v ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg" : "text-muted hover:text-ink"
              )}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="কোনো সাবস্ক্রিপশন নেই" description="ইউজার প্যাকেজ অ্যাসাইন করলে এখানে দেখা যাবে।" />
      ) : (
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">ইউজার আইডি</th>
                  <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                  <th className="px-4 py-3 font-medium">শুরু</th>
                  <th className="px-4 py-3 font-medium">মেয়াদ</th>
                  <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                  {can("subscriptions.manage") && (
                    <th className="px-4 py-3 text-right font-medium">অ্যাকশন</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <TableEmpty colSpan={6} />
                ) : filtered.map((s) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3 text-xs text-muted"><code>{s.userId}</code></td>
                    <td className="px-4 py-3 text-ink">{s.packageId || "—"}</td>
                    <td className="px-4 py-3 text-muted">{toBanglaDate(s.startDate)}</td>
                    <td className="px-4 py-3 text-muted">{toBanglaDate(s.expiryDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    {can("subscriptions.manage") && (
                      <td className="px-4 py-3 text-right">
                        {s.status === "active" && (
                          <button
                            onClick={() => doCancel(s.id)}
                            className="inline-flex items-center gap-1 rounded-[9px] px-2 py-1 text-xs text-danger hover:bg-danger/10"
                          >
                            <XCircle className="h-3.5 w-3.5" /> বাতিল
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title} message={confirm?.message} danger={confirm?.danger}
        onCancel={() => setConfirm(null)} onConfirm={confirm?.onConfirm}
      />
    </div>
  );
}