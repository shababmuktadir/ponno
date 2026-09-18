import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Trash2, Star, Rocket, Palette as PaletteIcon,
  Sparkles, Package as PackageIcon, Zap, Crown, Gem, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getPackage, createPackage, updatePackage, deletePackage,
} from "@/services/firebase/packageService";
import { getPricingSettings } from "@/services/firebase/pricingService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { PAGES } from "@/config/features";
import { toBn } from "@/config/pricing";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageFeatureSection from "@/admin/components/packaging/PageFeatureSection";
import PricingPreview from "@/admin/components/packaging/PricingPreview";
import { AdminPageHeader, ConfirmDialog } from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const ICON_OPTIONS = [
  { id: "Sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "Package", icon: PackageIcon, label: "Package" },
  { id: "Zap", icon: Zap, label: "Zap" },
  { id: "Rocket", icon: Rocket, label: "Rocket" },
  { id: "Crown", icon: Crown, label: "Crown" },
  { id: "Gem", icon: Gem, label: "Gem" },
];

const COLOR_PRESETS = [
  "#9CA3AF", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444",
  "#22C55E", "#14B8A6", "#EC4899", "#84CC16", "#C9B994",
];

const EMPTY = {
  name: "",
  badge: "",
  description: "",
  icon: "Sparkles",
  color: "#C9B994",
  monthlyPrice: 0,
  yearlyDiscount: 15,
  fiveYearDiscount: 30,
  active: true,
  popular: false,
  order: 999,
  pages: {},
  limits: {},
};

export default function PackageEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const actor = {
    uid: profile?.uid,
    name: profile?.name,
    role: profile?.role,
  };

  /* ---------------- Load ---------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const p = await getPricingSettings();
        if (!cancel) setPricing(p);

        if (!isNew && id) {
          const pkg = await getPackage(id);
          if (!pkg) {
            toast.error("প্যাকেজ পাওয়া যায়নি");
            navigate("/admin/packages");
            return;
          }
          if (!cancel) {
            setForm({
              ...EMPTY,
              ...pkg,
              pages: pkg.pages || {},
              limits: pkg.limits || {},
            });
          }
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id, isNew, navigate]);

  /* ---------------- Dirty check ---------------- */
  const dirty = useMemo(() => {
    return form.name.trim() !== "" && form.monthlyPrice >= 0;
  }, [form.name, form.monthlyPrice]);

  /* ---------------- Actions ---------------- */
  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updatePageData = (pageId, newData) => {
    setForm((f) => ({
      ...f,
      pages: { ...f.pages, [pageId]: newData },
    }));
  };

  const onSave = async () => {
    if (!form.name.trim()) return toast.error("প্যাকেজের নাম দিন");
    if (form.monthlyPrice < 0) return toast.error("মূল্য সঠিক নয়");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        badge: form.badge?.trim() || "",
        description: form.description?.trim() || "",
        icon: form.icon,
        color: form.color,
        monthlyPrice: Number(form.monthlyPrice) || 0,
        yearlyDiscount: Number(form.yearlyDiscount) || 0,
        fiveYearDiscount: Number(form.fiveYearDiscount) || 0,
        active: !!form.active,
        popular: !!form.popular,
        order: Number(form.order) || 999,
        pages: form.pages || {},
        limits: form.limits || {},
      };

      if (isNew) {
        const newId = await createPackage(payload, actor);
        toast.success("প্যাকেজ তৈরি হয়েছে");
        navigate(`/admin/packages/${newId}`, { replace: true });
      } else {
        await updatePackage(id, payload, actor);
        toast.success("সংরক্ষিত হয়েছে");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    setConfirm({
      title: "প্যাকেজ মুছবেন?",
      message: "এই ক্রিয়া ফিরিয়ে আনা যাবে না। ব্যবহারকারীদের এই প্যাকেজ থেকে সরিয়ে নিন।",
      danger: true,
      onConfirm: async () => {
        try {
          await deletePackage(id, actor);
          toast.success("মুছে ফেলা হয়েছে");
          navigate("/admin/packages");
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
          <p className="text-sm text-muted">লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-5 pb-24">
      <button
        onClick={() => navigate("/admin/packages")}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        প্যাকেজ লিস্টে ফিরে যান
      </button>

      <AdminPageHeader
        title={isNew ? "নতুন প্যাকেজ" : `প্যাকেজ: ${form.name || "—"}`}
        subtitle="মূল্য, ফিচার ও সীমা সব এখান থেকে নিয়ন্ত্রণ করুন।"
        actions={
          <>
            {!isNew && (
              <Button variant="secondary" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                মুছুন
              </Button>
            )}
            <Button onClick={onSave} loading={saving} disabled={!dirty}>
              <Save className="h-4 w-4" />
              সংরক্ষণ
            </Button>
          </>
        }
      />

      {/* ============ Basic info ============ */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          প্যাকেজের তথ্য
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="প্যাকেজ নাম"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="যেমন: Starter"
            required
          />
          <Input
            label="ব্যাজ"
            value={form.badge}
            onChange={(e) => updateField("badge", e.target.value)}
            placeholder="যেমন: স্টার্টার"
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-medium text-ink">
            বিবরণ
          </label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="সংক্ষিপ্ত বিবরণ"
            className="w-full rounded-[12px] border border-line bg-surface/70 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent-strong/70"
          />
        </div>

        {/* Icon selector */}
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-medium text-ink">আইকন</p>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(({ id: iconId, icon: Icon, label }) => (
              <button
                key={iconId}
                type="button"
                onClick={() => updateField("icon", iconId)}
                className={cn(
                  "flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-xs transition-all",
                  form.icon === iconId
                    ? "border-accent-strong bg-accent/20 text-ink"
                    : "border-line bg-surface/50 text-muted hover:border-line-strong"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Color selector */}
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-medium text-ink">রঙ</p>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateField("color", c)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-all",
                  form.color === c
                    ? "scale-110 border-ink dark:border-accent-strong"
                    : "border-transparent hover:scale-105"
                )}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
            <label className="ml-2 inline-flex items-center gap-1.5 text-xs text-muted">
              কাস্টম:
              <input
                type="color"
                value={form.color}
                onChange={(e) => updateField("color", e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-line bg-transparent p-0"
              />
            </label>
          </div>
        </div>

        {/* Status toggles */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateField("active", !form.active)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs transition-all",
              form.active
                ? "border-success/40 bg-success/10 text-success"
                : "border-line bg-surface-2 text-muted"
            )}
          >
            {form.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </button>
          <button
            type="button"
            onClick={() => updateField("popular", !form.popular)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs transition-all",
              form.popular
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-line bg-surface-2 text-muted"
            )}
          >
            <Star className="h-3.5 w-3.5" />
            জনপ্রিয়
          </button>
          <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface/50 px-3 py-1.5">
            <span className="text-xs text-muted">ক্রম:</span>
            <input
              type="number"
              min="1"
              value={form.order}
              onChange={(e) => updateField("order", Number(e.target.value))}
              className="h-7 w-16 rounded border border-line bg-surface-solid px-2 text-xs text-ink focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* ============ Pricing ============ */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">মূল্য নির্ধারণ</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="মাসিক মূল্য (৳)"
            type="number"
            min="0"
            value={form.monthlyPrice}
            onChange={(e) => updateField("monthlyPrice", e.target.value)}
          />
          <Input
            label="বার্ষিক ছাড় (%)"
            type="number"
            min="0"
            max="100"
            value={form.yearlyDiscount}
            onChange={(e) => updateField("yearlyDiscount", e.target.value)}
            hint={pricing ? `ডিফল্ট: ${pricing.yearlyDiscount}%` : ""}
          />
          <Input
            label="৫ বছর ছাড় (%)"
            type="number"
            min="0"
            max="100"
            value={form.fiveYearDiscount}
            onChange={(e) => updateField("fiveYearDiscount", e.target.value)}
            hint={pricing ? `ডিফল্ট: ${pricing.fiveYearDiscount}%` : ""}
          />
        </div>

        <div className="mt-5">
          <PricingPreview
            monthlyPrice={form.monthlyPrice}
            yearlyDiscount={form.yearlyDiscount}
            fiveYearDiscount={form.fiveYearDiscount}
          />
        </div>
      </Card>

      {/* ============ Page features ============ */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          পেজ ও ফিচার নিয়ন্ত্রণ
        </h2>

        <div className="space-y-3">
          {PAGES.map((page) => (
            <PageFeatureSection
              key={page.id}
              pageId={page.id}
              pageData={form.pages?.[page.id] || { access: false, features: {} }}
              onChange={(v) => updatePageData(page.id, v)}
            />
          ))}
        </div>
      </Card>

      {/* ============ Sticky save footer ============ */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-line bg-surface/95 backdrop-blur-xl lg:left-[var(--sidebar-w)]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-xs text-muted">
            {isNew ? "নতুন প্যাকেজ তৈরি হচ্ছে" : "পরিবর্তন সংরক্ষণ করুন"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/packages")}
            >
              বাতিল
            </Button>
            <Button onClick={onSave} loading={saving} disabled={!dirty}>
              <Save className="h-4 w-4" />
              সংরক্ষণ
            </Button>
          </div>
        </div>
      </div>

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