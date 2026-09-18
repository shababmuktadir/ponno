import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  User as UserIcon, Upload, Save, Building2, Type, ShieldCheck,
  Camera, X, Image as ImageIcon, Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useBranding } from "@/hooks/useBranding";
import { uploadToCloudinary } from "@/services/cloudinary/cloudinaryService";
import { getErrorMessage } from "@/utils/errors";
import {
  getWorkspace, createWorkspaceIfMissing, updateWorkspace,
} from "@/services/firebase/userService";
import { updateMe } from "@/services/firebase/userService";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FontSizePicker from "@/admin/components/FontSizePicker";
import { cn } from "@/utils/cn";

const TABS = [
  { id: "profile",  label: "প্রোফাইল",    icon: UserIcon },
  { id: "business", label: "ব্যবসা ও লোগো", icon: Building2 },
  { id: "display",  label: "ডিসপ্লে",      icon: Type },
  { id: "security", label: "নিরাপত্তা",    icon: ShieldCheck },
];

export default function UserSettings() {
  const { profile, uid, workspaceId, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const branding = useBranding();
  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          সেটিংস
        </h1>
        <p className="mt-1 text-sm text-muted">
          আপনার প্রোফাইল, ব্যবসার লোগো ও ডিসপ্লে পছন্দ।
        </p>
      </header>

      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
              tab === id
                ? "bg-ink text-bg shadow-[var(--shadow-xs)] dark:bg-accent dark:text-accent-fg"
                : "text-muted hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileTab
          profile={profile}
          uid={uid}
          refreshProfile={refreshProfile}
        />
      )}

      {tab === "business" && (
        <BusinessTab
          workspaceId={workspaceId}
          profile={profile}
          refreshProfile={refreshProfile}
          branding={branding}
        />
      )}

      {tab === "display" && (
        <DisplayTab theme={theme} setTheme={setTheme} />
      )}

      {tab === "security" && <SecurityTab profile={profile} />}
    </div>
  );
}

/* ================================================================== */
/*  PROFILE                                                            */
/* ================================================================== */
function ProfileTab({ profile, uid, refreshProfile }) {
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [photo, setPhoto] = useState(profile?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setName(profile?.name || "");
    setPhone(profile?.phone || "");
    setPhoto(profile?.photoURL || "");
  }, [profile]);

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("শুধু ছবি নির্বাচন করুন");
    }
    if (file.size > 4 * 1024 * 1024) {
      return toast.error("ছবি ৪MB এর কম হতে হবে");
    }
    setUploading(true);
    try {
      const meta = await uploadToCloudinary(file, {
        kind: "image",
        folder: "Walton/profiles",
      });
      setPhoto(meta.secureUrl);
      toast.success("ছবি আপলোড হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("নাম দিন");
    setSaving(true);
    try {
      await updateMe(uid, {
        name: name.trim(),
        phone: phone.trim(),
        photoURL: photo || "",
      });
      await refreshProfile?.();
      toast.success("প্রোফাইল সংরক্ষিত হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || profile?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <Card variant="glass" className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">প্রোফাইল তথ্য</h2>

      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] border border-line bg-surface-2 text-2xl font-semibold text-ink">
            {photo ? (
              <img src={photo} alt="profile" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg shadow-[var(--shadow-md)] transition-transform hover:scale-105 disabled:opacity-60 dark:bg-accent dark:text-accent-fg"
            aria-label="ছবি পরিবর্তন"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <Input
            label="নাম"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম"
          />
          <Input
            label="মোবাইল"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
          />
          <Input label="ইমেইল" value={profile?.email || ""} disabled />
        </div>
      </div>

      {photo && (
        <button
          onClick={() => setPhoto("")}
          className="mt-3 inline-flex items-center gap-1 text-xs text-danger hover:underline"
        >
          <X className="h-3 w-3" /> ছবি সরান
        </button>
      )}

      <div className="mt-5 flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" /> সংরক্ষণ করুন
        </Button>
      </div>
    </Card>
  );
}

/* ================================================================== */
/*  BUSINESS + LOGO                                                    */
/* ================================================================== */
function BusinessTab({ workspaceId, profile, refreshProfile, branding }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef(null);

  const [form, setForm] = useState({
    businessName: "",
    dashboardName: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    logo: "",
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!workspaceId) return;
        let data = await getWorkspace(workspaceId);
        if (!data) {
          data = await createWorkspaceIfMissing(
            workspaceId,
            profile?.uid,
            profile?.name
          );
        }
        if (!cancel && data) {
          const logoUrl =
            (typeof data.logo === "string" ? data.logo : null) ||
            data.logo?.secureUrl ||
            data.logo?.url ||
            "";
          setForm({
            businessName: data.businessName || "",
            dashboardName: data.dashboardName || "",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            website: data.website || "",
            logo: logoUrl,
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [workspaceId, profile?.uid, profile?.name]);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("শুধু ছবি নির্বাচন করুন");
    }
    if (file.size > 3 * 1024 * 1024) {
      return toast.error("লোগো ৩MB এর কম হতে হবে");
    }
    setUploading(true);
    try {
      const meta = await uploadToCloudinary(file, {
        kind: "image",
        folder: "Walton/logos",
      });
      setForm((f) => ({ ...f, logo: meta.secureUrl }));
      toast.success("লোগো আপলোড হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!workspaceId) return toast.error("ওয়ার্কস্পেস নেই");
    if (!form.businessName.trim()) return toast.error("ব্যবসার নাম দিন");
    setSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        businessName: form.businessName.trim(),
        dashboardName: form.dashboardName.trim() || form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        website: form.website.trim(),
        logo: form.logo
          ? { secureUrl: form.logo, url: form.logo, resourceType: "image" }
          : null,
      });
      await refreshProfile?.();
      toast.success("তথ্য সংরক্ষিত হয়েছে — সব পেজে প্রয়োগ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card variant="glass" className="p-8 text-center text-sm text-muted">
        লোড হচ্ছে…
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live preview */}
      <Card variant="glass" className="p-5">
        <p className="label-xs mb-3">লাইভ প্রিভিউ — সব রিপোর্টে এভাবে দেখাবে</p>
        <div className="flex items-center gap-3 rounded-[14px] border border-line bg-surface/50 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-line bg-surface-solid">
            {form.logo ? (
              <img
                src={form.logo}
                alt="logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-subtle" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {form.businessName || "আপনার ব্যবসার নাম"}
            </p>
            <p className="truncate text-[11px] text-muted">
              {form.address || "ঠিকানা"} {form.phone && `• ${form.phone}`}
            </p>
          </div>
        </div>
      </Card>

      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">ব্যবসার তথ্য</h2>

        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] border border-line bg-surface-2">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="logo"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-subtle" />
              )}
            </div>
            <button
              onClick={() => logoRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg shadow-[var(--shadow-md)] transition-transform hover:scale-105 disabled:opacity-60 dark:bg-accent dark:text-accent-fg"
              aria-label="লোগো পরিবর্তন"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <Input
              label="ব্যবসার নাম"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              placeholder="যেমন: Walton ট্রেডার্স"
            />
            <Input
              label="ড্যাশবোর্ড নাম"
              value={form.dashboardName}
              onChange={(e) =>
                setForm({ ...form, dashboardName: e.target.value })
              }
              placeholder="যদি ভিন্ন হয়"
              hint="খালি রাখলে ব্যবসার নাম ব্যবহার হবে"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Input
            label="ফোন"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="ইমেইল"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="ওয়েবসাইট"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          <Input
            label="ঠিকানা"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={save} loading={saving}>
            <Save className="h-4 w-4" /> সংরক্ষণ করুন
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  DISPLAY (Theme + Font size)                                        */
/* ================================================================== */
function DisplayTab({ theme, setTheme }) {
  return (
    <div className="space-y-4">
      {/* Theme — light/dark only */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">মোড</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { id: "light", label: "লাইট মোড", desc: "উজ্জ্বল ও পরিষ্কার", icon: Sun },
            { id: "dark",  label: "ডার্ক মোড", desc: "চোখের জন্য আরামদায়ক", icon: Moon },
          ].map((t) => {
            const active = theme === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] border p-3 text-left transition-all",
                  active
                    ? "border-accent-strong bg-accent/20"
                    : "border-line hover:border-line-strong hover:bg-surface-2/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[10px]",
                    active
                      ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                      : "bg-surface-2 text-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <p className="text-sm font-medium text-ink">{t.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{t.desc}</p>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-subtle">
          রঙের প্যালেট শুধু অ্যাডমিন পরিবর্তন করতে পারেন।
        </p>
      </Card>

      {/* Font size */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Type className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">টেক্সট আকার</h2>
        </div>
        <FontSizePicker />
        <p className="mt-3 text-[11px] text-subtle">
          আপনার অ্যাকাউন্টে সংরক্ষিত হবে — যেকোনো ডিভাইসে একই থাকবে।
        </p>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  SECURITY                                                           */
/* ================================================================== */
function SecurityTab({ profile }) {
  return (
    <Card variant="glass" className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">নিরাপত্তা</h2>
      <div className="space-y-3 text-sm">
        <div className="rounded-[12px] border border-line bg-surface/50 p-3">
          <p className="text-muted">ইমেইল verified</p>
          <p className="mt-1 text-ink">
            {profile?.emailVerified ? "✓ হ্যাঁ" : "✗ না"}
          </p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface/50 p-3">
          <p className="text-muted">অ্যাকাউন্ট স্ট্যাটাস</p>
          <p className="mt-1 text-ink">{profile?.accountStatus || "active"}</p>
        </div>
        <p className="text-xs text-subtle">
          পাসওয়ার্ড পরিবর্তন করতে ইমেইল থেকে "পাসওয়ার্ড ভুলে গেছেন" ব্যবহার
          করুন।
        </p>
      </div>
    </Card>
  );
}