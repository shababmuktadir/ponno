import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Plus, Trash2, Send } from "lucide-react";
import {
  listNotifications, createNotification, deleteNotification,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, ConfirmDialog } from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const TARGETS = [
  { v: "all",   l: "সবাই" },
  { v: "free",  l: "ফ্রি ইউজার" },
  { v: "paid",  l: "পেইড ইউজার" },
  { v: "staff", l: "স্টাফ" },
];

const EMPTY = { title: "", message: "", priority: "normal", target: "all" };

export default function Notifications() {
  const { profile, can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const actor = { uid: profile?.uid, name: profile?.name, role: profile?.role };

  const load = async () => {
    setLoading(true);
    try {
      const list = await listNotifications(200);
      setRows(list);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim())
      return toast.error("শিরোনাম ও বার্তা দিন।");
    setSaving(true);
    try {
      await createNotification(form, actor);
      toast.success("নোটিফিকেশন পাঠানো হয়েছে।");
      setForm(EMPTY);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const doDelete = (id) => {
    setConfirm({
      title: "নোটিফিকেশন মুছবেন?",
      message: "সব ইউজার থেকে এই নোটিফিকেশন চলে যাবে।",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteNotification(id, actor);
          toast.success("মুছে ফেলা হয়েছে।");
          setConfirm(null);
          load();
        } catch (err) { toast.error(getErrorMessage(err)); }
      },
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="নোটিফিকেশন"
        subtitle="প্ল্যাটফর্মের ঘোষণা ও বার্তা পাঠান।"
      />

      {can("notifications.manage") && (
        <Card variant="glass" className="p-5">
          <h2 className="text-sm font-semibold text-ink">নতুন নোটিফিকেশন</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input label="শিরোনাম" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink">বার্তা</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-[12px] border border-line bg-surface/70 px-3.5 py-2.5 text-sm text-ink backdrop-blur-md outline-none focus:border-accent-strong/70"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">গুরুত্ব</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink"
                >
                  <option value="low">নিম্ন</option>
                  <option value="normal">সাধারণ</option>
                  <option value="high">উচ্চ</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">টার্গেট</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink"
                >
                  {TARGETS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
            </div>
            <Button type="submit" loading={saving}>
              <Send className="h-4 w-4" /> পাঠান
            </Button>
          </form>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">
          পাঠানো নোটিফিকেশন ({rows.length})
        </h2>

        {loading ? (
          <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
        ) : rows.length === 0 ? (
          <EmptyState icon={Bell} title="কোনো নোটিফিকেশন নেই" description="উপরের ফর্ম থেকে প্রথম পাঠান।" />
        ) : (
          <div className="grid gap-3">
            {rows.map((n) => (
              <Card key={n.id} variant="glass" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        n.priority === "high" ? "border-danger/40 bg-danger/10 text-danger" :
                        n.priority === "low" ? "border-line bg-surface-2 text-subtle" :
                        "border-line-strong bg-surface-2 text-muted"
                      )}>
                        {n.priority === "high" ? "উচ্চ" : n.priority === "low" ? "নিম্ন" : "সাধারণ"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{n.message}</p>
                    <p className="mt-2 text-[11px] text-subtle">
                      {toBanglaDateTime(n.createdAt)} • টার্গেট: {n.target || "all"}
                    </p>
                  </div>
                  {can("notifications.manage") && (
                    <button
                      onClick={() => doDelete(n.id)}
                      className="rounded-[9px] p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title} message={confirm?.message} danger={confirm?.danger}
        onCancel={() => setConfirm(null)} onConfirm={confirm?.onConfirm}
      />
    </div>
  );
}