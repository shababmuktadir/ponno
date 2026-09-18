// src/admin/pages/Staff.jsx
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  UserCog, UserPlus, Shield, Trash2, Crown, RefreshCw, Search,
} from "lucide-react";
import {
  listStaff, promoteToStaff, demoteStaff, createStaff,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import {
  ROLES, STAFF_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, SUPER_ADMIN_UID,
} from "@/config/roles";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import {
  AdminPageHeader, RoleBadge, ConfirmDialog, TableEmpty,
} from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const ROLE_CARDS = [
  { role: ROLES.ADMIN,     icon: Shield,    tone: "danger" },
  { role: ROLES.MODERATOR, icon: UserCog,   tone: "warning" },
  { role: ROLES.EDITOR,    icon: UserPlus,  tone: "success" },
  { role: ROLES.SUPPORT,   icon: UserCog,   tone: "ink" },
];

export default function Staff() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ uid: "", email: "", name: "", role: ROLES.MODERATOR });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listStaff(200);
      setRows(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(term) ||
        (r.email || "").toLowerCase().includes(term) ||
        (r.id || "").toLowerCase().includes(term)
    );
  }, [rows, q]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.uid.trim()) return toast.error("Firebase UID দিন।");
    if (!form.email.trim()) return toast.error("ইমেইল দিন।");
    if (!STAFF_ROLES.includes(form.role)) return toast.error("রোল নির্বাচন করুন।");

    setSaving(true);
    try {
      await createStaff({
        uid: form.uid.trim(),
        email: form.email.trim(),
        name: form.name.trim() || form.email.split("@")[0],
        role: form.role,
        actor: { uid: profile?.uid, name: profile?.name, role: profile?.role },
      });
      toast.success("স্টাফ যোগ করা হয়েছে।");
      setForm({ uid: "", email: "", name: "", role: ROLES.MODERATOR });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onPromote = async (uid, role) => {
    try {
      await promoteToStaff(uid, role, { uid: profile?.uid, name: profile?.name, role: profile?.role });
      toast.success("রোল আপডেট হয়েছে।");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onDemote = (uid) => {
    setConfirm({
      title: "স্টাফ রোল বাতিল করবেন?",
      message: "এই ইউজার আর অ্যাডমিন প্যানেলে প্রবেশ করতে পারবে না।",
      danger: true,
      onConfirm: async () => {
        try {
          await demoteStaff(uid, { uid: profile?.uid, name: profile?.name, role: profile?.role });
          toast.success("রোল বাতিল করা হয়েছে।");
          setConfirm(null);
          load();
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="স্টাফ ম্যানেজমেন্ট"
        subtitle="অ্যাডমিন, মডারেটর, এডিটর ও সাপোর্ট যোগ ও নিয়ন্ত্রণ করুন।"
        actions={
          <Button variant="secondary" onClick={load}>
            <RefreshCw className="h-4 w-4" /> রিফ্রেশ
          </Button>
        }
      />

      {/* Role cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_CARDS.map(({ role, icon: Icon, tone }) => (
          <Card key={role} variant="glass" className="p-4">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[11px]",
              tone === "danger" ? "bg-danger/15 text-danger" :
              tone === "warning" ? "bg-warning/15 text-warning" :
              tone === "success" ? "bg-success/15 text-success" :
              "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{ROLE_LABELS[role]}</p>
            <p className="mt-1 text-xs text-muted">{ROLE_DESCRIPTIONS[role]}</p>
          </Card>
        ))}
      </div>

      {/* Add form */}
      <Card variant="glass" className="p-5">
        <h2 className="text-sm font-semibold text-ink">নতুন স্টাফ যোগ করুন</h2>
        <p className="mt-1 text-xs text-muted">
          ব্যবহারকারীকে আগে Firebase Authentication-এ অ্যাকাউন্ট তৈরি করতে হবে, তারপর তার UID দিয়ে এখানে যোগ করুন।
        </p>
        <form onSubmit={onCreate} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Firebase UID"
              placeholder="IfTBq2rSXWIk6ZdcKol9fUZH7r1"
              value={form.uid}
              onChange={(e) => setForm({ ...form, uid: e.target.value })}
              required
            />
            <Input
              label="ইমেইল"
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="নাম (ঐচ্ছিক)"
              placeholder="নাম লিখুন"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink">রোল</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink backdrop-blur-md focus:border-accent-strong/70 focus:outline-none"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" loading={saving} size="lg">
            <UserPlus className="h-4 w-4" />
            স্টাফ যোগ করুন
          </Button>
        </form>
      </Card>

      {/* List */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">
            বর্তমান স্টাফ ({rows.length})
          </h2>
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="নাম, ইমেইল বা UID দিয়ে খুঁজুন…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Desktop table */}
        <Card variant="glass" className="hidden overflow-hidden p-0 lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">নাম</th>
                  <th className="px-4 py-3 font-medium">ইমেইল</th>
                  <th className="px-4 py-3 font-medium">রোল</th>
                  <th className="px-4 py-3 font-medium">যোগদান</th>
                  <th className="px-4 py-3 text-right font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} message="লোড হচ্ছে…" />
                ) : filtered.length === 0 ? (
                  <TableEmpty colSpan={5} message="কোনো স্টাফ পাওয়া যায়নি।" />
                ) : (
                  filtered.map((s) => {
                    const isSuper = s.id === SUPER_ADMIN_UID;
                    return (
                      <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isSuper && <Crown className="h-3.5 w-3.5 text-accent-strong" />}
                            <span className="text-ink">{s.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{s.email}</td>
                        <td className="px-4 py-3">
                          {isSuper ? (
                            <RoleBadge role="superAdmin" />
                          ) : (
                            <select
                              value={s.role}
                              onChange={(e) => onPromote(s.id, e.target.value)}
                              className="rounded-[9px] border border-line bg-surface/60 px-2 py-1 text-xs text-ink"
                            >
                              {STAFF_ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">{toBanglaDate(s.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {!isSuper && (
                            <button
                              onClick={() => onDemote(s.id)}
                              className="inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              বাতিল
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile cards */}
        <div className="grid gap-3 lg:hidden">
          {loading ? (
            <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
          ) : filtered.length === 0 ? (
            <EmptyState icon={UserCog} title="স্টাফ নেই" description="উপরের ফর্ম থেকে যোগ করুন।" />
          ) : (
            filtered.map((s) => {
              const isSuper = s.id === SUPER_ADMIN_UID;
              return (
                <Card key={s.id} variant="glass" className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isSuper && <Crown className="h-3.5 w-3.5 text-accent-strong" />}
                        <p className="truncate text-sm font-semibold text-ink">{s.name || "—"}</p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">{s.email}</p>
                    </div>
                    {isSuper ? <RoleBadge role="superAdmin" /> : <RoleBadge role={s.role} />}
                  </div>
                  {!isSuper && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STAFF_ROLES.filter((r) => r !== s.role).map((r) => (
                        <button
                          key={r}
                          onClick={() => onPromote(s.id, r)}
                          className="rounded-[9px] border border-line px-2.5 py-1 text-[11px] text-muted hover:border-line-strong hover:text-ink"
                        >
                          → {ROLE_LABELS[r]}
                        </button>
                      ))}
                      <button
                        onClick={() => onDemote(s.id)}
                        className="rounded-[9px] border border-danger/40 px-2.5 py-1 text-[11px] text-danger"
                      >
                        রোল বাতিল
                      </button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </section>

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