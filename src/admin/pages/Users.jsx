import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Users as UsersIcon, Eye, Ban, Check, RefreshCw } from "lucide-react";
import {
  listUsers, suspendUser, reactivateUser,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import {
  AdminPageHeader, RoleBadge, StatusBadge, TableEmpty, ConfirmDialog,
} from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

export default function Users() {
  const { profile, can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listUsers({ max: 500 });
      setRows(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((u) => {
      const matchQ =
        !term ||
        (u.name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.phone || "").includes(term) ||
        (u.id || "").toLowerCase().includes(term);
      const matchS = status === "all" || u.accountStatus === status;
      return matchQ && matchS;
    });
  }, [rows, q, status]);

  const actor = { uid: profile?.uid, name: profile?.name, role: profile?.role };

  const doSuspend = (uid) => {
    setConfirm({
      title: "ইউজার নিষ্ক্রিয় করবেন?",
      message: "এই ইউজার আর সিস্টেমে প্রবেশ করতে পারবে না।",
      danger: true,
      onConfirm: async () => {
        try {
          await suspendUser(uid, actor);
          toast.success("নিষ্ক্রিয় করা হয়েছে।");
          setConfirm(null);
          load();
        } catch (err) { toast.error(getErrorMessage(err)); }
      },
    });
  };

  const doReactivate = async (uid) => {
    try {
      await reactivateUser(uid, actor);
      toast.success("পুনরায় সক্রিয় করা হয়েছে।");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const filters = [
    { v: "all",       l: "সব" },
    { v: "active",    l: "সক্রিয়" },
    { v: "pending",   l: "পেন্ডিং" },
    { v: "suspended", l: "নিষ্ক্রিয়" },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="ইউজার লিস্ট"
        subtitle="প্ল্যাটফর্মের সব ব্যবহারকারী।"
        actions={
          <Button variant="secondary" onClick={load}>
            <RefreshCw className="h-4 w-4" /> রিফ্রেশ
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="নাম, ইমেইল, ফোন বা UID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
          {filters.map((s) => (
            <button
              key={s.v}
              onClick={() => setStatus(s.v)}
              className={cn(
                "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors",
                status === s.v ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg" : "text-muted hover:text-ink"
              )}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="কোনো ইউজার পাওয়া যায়নি"
          description="অন্য কিছু দিয়ে খুঁজে দেখুন।"
        />
      ) : (
        <>
          <Card variant="glass" className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">নাম</th>
                    <th className="px-4 py-3 font-medium">ইমেইল</th>
                    <th className="px-4 py-3 font-medium">মোবাইল</th>
                    <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                    <th className="px-4 py-3 font-medium">রোল</th>
                    <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                    <th className="px-4 py-3 font-medium">যুক্ত</th>
                    <th className="px-4 py-3 text-right font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                      <td className="px-4 py-3 text-ink">{u.name || "—"}</td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3 text-muted">{u.phone ? toBanglaNumber(u.phone) : "—"}</td>
                      <td className="px-4 py-3 text-muted">{u.packageId || "free"}</td>
                      <td className="px-4 py-3"><RoleBadge role={u.role || "user"} /></td>
                      <td className="px-4 py-3"><StatusBadge status={u.accountStatus} /></td>
                      <td className="px-4 py-3 text-muted">{toBanglaDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="rounded-[9px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                            title="বিস্তারিত"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {can("users.suspend") && (
                            u.accountStatus === "suspended" ? (
                              <button
                                onClick={() => doReactivate(u.id)}
                                className="rounded-[9px] p-1.5 text-success hover:bg-success/10"
                                title="সক্রিয় করুন"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => doSuspend(u.id)}
                                className="rounded-[9px] p-1.5 text-danger hover:bg-danger/10"
                                title="নিষ্ক্রিয়"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-3 lg:hidden">
            {filtered.map((u) => (
              <Card key={u.id} variant="glass" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{u.name || "—"}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <StatusBadge status={u.accountStatus} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>📱 {u.phone ? toBanglaNumber(u.phone) : "—"}</span>
                  <span>📦 {u.packageId || "free"}</span>
                  <span>📅 {toBanglaDate(u.createdAt)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="flex-1 rounded-[10px] border border-line px-3 py-1.5 text-center text-xs text-ink hover:bg-surface-2"
                  >
                    বিস্তারিত
                  </Link>
                  {can("users.suspend") && (
                    u.accountStatus === "suspended" ? (
                      <button
                        onClick={() => doReactivate(u.id)}
                        className="flex-1 rounded-[10px] bg-success/10 px-3 py-1.5 text-xs text-success"
                      >
                        সক্রিয়
                      </button>
                    ) : (
                      <button
                        onClick={() => doSuspend(u.id)}
                        className="flex-1 rounded-[10px] bg-danger/10 px-3 py-1.5 text-xs text-danger"
                      >
                        নিষ্ক্রিয়
                      </button>
                    )
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />
    </div>
  );
}