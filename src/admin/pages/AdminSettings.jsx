import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon, Save, ShieldCheck, Palette, Type, Download,
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getErrorMessage } from "@/utils/errors";
import { SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL } from "@/config/roles";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstallButton from "@/components/ui/InstallButton";
import usePWAInstall from "@/hooks/usePWAInstall";
import { AdminPageHeader } from "@/admin/components/AdminUI";
import FontSizePicker from "@/admin/components/FontSizePicker";
import { cn } from "@/utils/cn";

const REF = () => doc(db, "systemSettings", "global");

const THEME_OPTIONS = [
  { id: "light", label: "লাইট মোড", desc: "নরম ও উষ্ণ অনুভূতি" },
  { id: "dark",  label: "ডার্ক মোড", desc: "গেমিং ও নিয়ন ভাইব" },
];

export default function AdminSettings() {
  const { isSuperAdmin, profile, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { installed, canInstall, isIOS } = usePWAInstall();
  const [form, setForm] = useState({
    platformName: "প্রোডাক্ট ম্যানেজমেন্ট",
    supportEmail: SUPER_ADMIN_EMAIL,
    maintenanceMode: false,
    announcement: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(REF());
        if (snap.exists()) setForm((f) => ({ ...f, ...snap.data() }));
      } catch (err) {
        if (import.meta.env.DEV) console.log(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (!isSuperAdmin)
      return toast.error("শুধু সুপার অ্যাডমিন পরিবর্তন করতে পারে।");
    setSaving(true);
    try {
      await setDoc(
        REF(),
        { ...form, updatedAt: serverTimestamp() },
        { merge: true }
      );
      toast.success("সংরক্ষিত হয়েছে।");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="সিস্টেম সেটিংস"
        subtitle="প্ল্যাটফর্ম-ব্যাপী কনফিগারেশন ও অ্যাকাউন্ট তথ্য।"
      />

      {/* ---------- Super admin identity ---------- */}
      <Card variant="glass" className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">সুপার অ্যাডমিন</h2>
        </div>
        <div className="mt-3 rounded-[12px] border border-accent-strong/40 bg-accent/15 p-3 text-xs">
          <p className="text-ink">
            UID: <code className="text-ink">{SUPER_ADMIN_UID}</code>
          </p>
          <p className="mt-1 text-ink">
            ইমেইল: <code className="text-ink">{SUPER_ADMIN_EMAIL}</code>
          </p>
          <p className="mt-1 text-muted">
            এই অ্যাকাউন্ট কখনো মুছে ফেলা বা ডিমোট করা যাবে না।
          </p>
        </div>
        <p className="mt-3 text-xs text-muted">
          আপনার রোল: <b className="text-ink">{role}</b>{" "}
          {profile?.email ? `(${profile.email})` : ""}
        </p>
      </Card>

      {/* ---------- Install as App ---------- */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">
            অ্যাপ হিসেবে ইনস্টল
          </h2>
        </div>

        <p className="text-sm text-muted">
          এই অ্যাডমিন প্যানেলটি আপনার ফোন বা কম্পিউটারে আসল অ্যাপের মতো
          ইনস্টল করে নিতে পারবেন। ইনস্টল করার পর হোম স্ক্রিন থেকে সরাসরি
          খুলবে, fullscreen-এ চলবে এবং দ্রুত লোড হবে।
        </p>

        <div className="mt-4">
          <InstallButton size="lg" />
        </div>

        {!canInstall && !installed && !isIOS && (
          <div className="mt-3 rounded-[10px] border border-line bg-surface/60 p-3 text-[11px] text-muted">
            <p className="font-medium text-ink">ব্রাউজার থেকে ইনস্টল:</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>
                <b className="text-ink">Chrome/Edge:</b> ঠিকানা বারের ডানে ⊕
                আইকন বা ⋮ → "Install app"
              </li>
              <li>
                <b className="text-ink">Firefox (Android):</b> ⋮ → "Install"
              </li>
              <li>
                <b className="text-ink">Safari (iOS):</b> Share → "Add to Home
                Screen"
              </li>
            </ul>
          </div>
        )}

        {installed && (
          <div className="mt-3 rounded-[10px] border border-success/40 bg-success/10 p-3 text-xs text-success">
            ✓ এই অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে।
          </div>
        )}
      </Card>

      {/* ---------- Appearance: Font size ---------- */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Type className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">টেক্সট আকার</h2>
        </div>
        <FontSizePicker />
        <p className="mt-3 text-[11px] text-subtle">
          পরিবর্তন সাথে সাথে পুরো প্ল্যাটফর্মে প্রয়োগ হবে ও স্বয়ংক্রিয়ভাবে
          সংরক্ষিত হবে।
        </p>
      </Card>

      {/* ---------- Appearance: Theme ---------- */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">থিম</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {THEME_OPTIONS.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "rounded-[12px] border p-3 text-left transition-all",
                  active
                    ? "border-accent-strong bg-accent/20 dark:bg-accent/15"
                    : "border-line hover:border-line-strong hover:bg-surface-2/60"
                )}
              >
                <p className="text-sm font-medium text-ink">{t.label}</p>
                <p className="mt-0.5 text-[11px] text-muted">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ---------- Global settings ---------- */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">গ্লোবাল সেটিংস</h2>
        </div>

        {loading ? (
          <p className="text-sm text-muted">লোড হচ্ছে…</p>
        ) : (
          <div className="space-y-4">
            <Input
              label="প্ল্যাটফর্মের নাম"
              value={form.platformName}
              onChange={(e) =>
                setForm({ ...form, platformName: e.target.value })
              }
              disabled={!isSuperAdmin}
            />
            <Input
              label="সাপোর্ট ইমেইল"
              type="email"
              value={form.supportEmail}
              onChange={(e) =>
                setForm({ ...form, supportEmail: e.target.value })
              }
              disabled={!isSuperAdmin}
            />
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink">
                ঘোষণা
              </label>
              <textarea
                rows={3}
                value={form.announcement}
                onChange={(e) =>
                  setForm({ ...form, announcement: e.target.value })
                }
                disabled={!isSuperAdmin}
                className="w-full rounded-[12px] border border-line bg-surface/70 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent-strong/70 disabled:opacity-60"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={!!form.maintenanceMode}
                onChange={(e) =>
                  setForm({ ...form, maintenanceMode: e.target.checked })
                }
                disabled={!isSuperAdmin}
                className="h-4 w-4"
              />
              মেইনটেন্যান্স মোড (ইউজারদের জন্য অ্যাপ বন্ধ)
            </label>

            {isSuperAdmin ? (
              <Button onClick={save} loading={saving}>
                <Save className="h-4 w-4" /> সংরক্ষণ
              </Button>
            ) : (
              <p className="text-xs text-subtle">
                এই অংশ শুধুমাত্র সুপার অ্যাডমিন পরিবর্তন করতে পারেন।
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}