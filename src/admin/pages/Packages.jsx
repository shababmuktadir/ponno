import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Package as PackageIcon, Trash2, Save, X, Edit3 } from "lucide-react";
import {
  listPackages, createPackage, updatePackage, deletePackage,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, ConfirmDialog } from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const EMPTY = {
  name: "",
  price: 0,
  durationDays: 30,
  products: 50,
  categories: 5,
  members: 1,
  storageMB: 100,
  productImages: false,
  productVideos: false,
  invoice: true,
  reports: true,
  sms: false,
  chat: true,
  status: "active",
};

const FEATURES = [
  ["productImages", "প্রোডাক্ট ছবি"],
  ["productVideos", "প্রোডাক্ট ভিডিও"],
  ["invoice", "ইনভয়েস"],
  ["reports", "রিপোর্ট"],
  ["sms", "এসএমএস"],
  ["chat", "চ্যাট"],
];

function PackageForm({ initial, onSubmit, onCancel, saving, submitLabel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="প্যাকেজের নাম" placeholder="যেমন: ৬৫০ টাকা"
          value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <Input label="মূল্য (৳)" type="number" min="0"
          value={form.price} onChange={(e) => set("price", e.target.value)} />
        <Input label="মেয়াদ (দিন)" type="number" min="1"
          value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Input label="সর্বোচ্চ প্রোডাক্ট" type="number" min="0"
          value={form.products} onChange={(e) => set("products", e.target.value)} />
        <Input label="সর্বোচ্চ ক্যাটাগরি" type="number" min="0"
          value={form.categories} onChange={(e) => set("categories", e.target.value)} />
        <Input label="সর্বোচ্চ সদস্য" type="number" min="0"
          value={form.members} onChange={(e) => set("members", e.target.value)} />
        <Input label="স্টোরেজ (MB)" type="number" min="0"
          value={form.storageMB} onChange={(e) => set("storageMB", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {FEATURES.map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => set(key, !form[key])}
            className={cn(
              "rounded-[11px] border px-3 py-2 text-xs transition-all",
              form[key]
                ? "border-accent-strong bg-accent/25 text-ink"
                : "border-line text-muted hover:border-line-strong"
            )}
          >
            {form[key] ? "✓ " : "✗ "}{label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" /> {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
        )}
      </div>
    </form>
  );
}

function pkgToForm(p) {
  return {
    name: p.name || "",
    price: p.price || 0,
    durationDays: p.durationDays || 30,
    products: p.limits?.products ?? 50,
    categories: p.limits?.categories ?? 5,
    members: p.limits?.members ?? 1,
    storageMB: p.limits?.storageMB ?? 100,
    productImages: !!p.features?.productImages,
    productVideos: !!p.features?.productVideos,
    invoice: !!p.features?.invoice,
    reports: !!p.features?.reports,
    sms: !!p.features?.sms,
    chat: !!p.features?.chat,
    status: p.status || "active",
  };
}

export default function Packages() {
  const { profile, can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const actor = { uid: profile?.uid, name: profile?.name, role: profile?.role };

  const load = async () => {
    setLoading(true);
    try {
      const list = await listPackages();
      setRows(list);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (form) => {
    if (!form.name.trim()) return toast.error("প্যাকেজের নাম দিন।");
    setSaving(true);
    try {
      await createPackage({
        name: form.name.trim(),
        price: Number(form.price) || 0,
        durationDays: Number(form.durationDays) || 30,
        limits: {
          products: Number(form.products) || 0,
          categories: Number(form.categories) || 0,
          members: Number(form.members) || 0,
          storageMB: Number(form.storageMB) || 0,
        },
        features: {
          productImages: Boolean(form.productImages),
          productVideos: Boolean(form.productVideos),
          invoice: Boolean(form.invoice),
          reports: Boolean(form.reports),
          sms: Boolean(form.sms),
          chat: Boolean(form.chat),
        },
        status: form.status || "active",
      }, actor);
      toast.success("প্যাকেজ তৈরি হয়েছে।");
      setShowCreate(false);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const onUpdate = async (id, form) => {
    setSaving(true);
    try {
      await updatePackage(id, {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        durationDays: Number(form.durationDays) || 30,
        limits: {
          products: Number(form.products) || 0,
          categories: Number(form.categories) || 0,
          members: Number(form.members) || 0,
          storageMB: Number(form.storageMB) || 0,
        },
        features: {
          productImages: Boolean(form.productImages),
          productVideos: Boolean(form.productVideos),
          invoice: Boolean(form.invoice),
          reports: Boolean(form.reports),
          sms: Boolean(form.sms),
          chat: Boolean(form.chat),
        },
        status: form.status || "active",
      }, actor);
      toast.success("প্যাকেজ আপডেট হয়েছে।");
      setEditingId(null);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const onDelete = (id) => {
    setConfirm({
      title: "প্যাকেজ মুছবেন?",
      message: "এই ক্রিয়া ফিরিয়ে আনা যাবে না।",
      danger: true,
      onConfirm: async () => {
        try {
          await deletePackage(id, actor);
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
        title="প্যাকেজ ব্যবস্থাপনা"
        subtitle="প্যাকেজের মূল্য, মেয়াদ, সীমা ও ফিচার নির্ধারণ করুন।"
        actions={
          can("packages.manage") && (
            <Button onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showCreate ? "ফর্ম বন্ধ করুন" : "নতুন প্যাকেজ"}
            </Button>
          )
        }
      />

      {showCreate && (
        <Card variant="glass" className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">নতুন প্যাকেজ</h2>
          <PackageForm
            onSubmit={onCreate}
            onCancel={() => setShowCreate(false)}
            saving={saving}
            submitLabel="তৈরি করুন"
          />
        </Card>
      )}

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="এখনো কোনো প্যাকেজ নেই"
          description="উপরের বাটন থেকে প্রথম প্যাকেজ তৈরি করুন।"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <Card key={p.id} variant="glass" className="p-4">
                {isEditing ? (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">সম্পাদনা</p>
                      <button onClick={() => setEditingId(null)}
                        className="rounded-[9px] p-1.5 hover:bg-surface-2">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <PackageForm
                      initial={pkgToForm(p)}
                      onSubmit={(f) => onUpdate(p.id, f)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                      submitLabel="আপডেট"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{p.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatTaka(p.price)} • {toBanglaNumber(p.durationDays)} দিন
                        </p>
                      </div>
                      {can("packages.manage") && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingId(p.id)}
                            className="rounded-[9px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="rounded-[9px] p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-muted">
                      <span>প্রোডাক্ট: {toBanglaNumber(p.limits?.products || 0)}</span>
                      <span>ক্যাটাগরি: {toBanglaNumber(p.limits?.categories || 0)}</span>
                      <span>সদস্য: {toBanglaNumber(p.limits?.members || 0)}</span>
                      <span>স্টোরেজ: {toBanglaNumber(p.limits?.storageMB || 0)} MB</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {FEATURES.map(([k, label]) => (
                        <span
                          key={k}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px]",
                            p.features?.[k]
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-line bg-surface-2 text-subtle"
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
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