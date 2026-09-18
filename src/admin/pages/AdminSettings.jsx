import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon, Save, ShieldCheck, Palette as PaletteIcon,
  Type, Download,
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL } from "@/config/roles";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstallButton from "@/components/ui/InstallButton";
import usePWAInstall from "@/hooks/usePWAInstall";
import { AdminPageHeader } from "@/admin/components/AdminUI";
import FontSizePicker from "@/admin/components/FontSizePicker";
import PaletteBuilder from "@/admin/components/PaletteBuilder";

const REF = () => doc(db, "systemSettings", "global");

export default function AdminSettings() {
  const { isSuperAdmin, profile, role } = useAuth();
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
    let cancel = false;
    (async () => {
      try {
        const snap = await getDoc(REF());
        if (!cancel && snap.exists()) {
          setForm((f) => ({ ...f, ...snap.data() }));
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
  }, []);

  const save = async () => {
    if (!isSuperAdmin) {
      toast.error("শুধু সুপার অ্যাডমিন পরিবর্তন করতে পারে।");
      return;
    }
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
        subtitle="থিম, ফন্ট, প্যালেট ও প্ল্যাটফর্ম কনফিগ।"
      />

      {/* GLOBAL COLOR PALETTE */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <PaletteIcon className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">
            গ্লোবাল রঙের প্যালেট
          </h2>
          <span className="ml-auto rounded-full border border-accent-strong/60 bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-ink">
            সব ইউজার
          </span>
        </div>
        <p className="mb-4 text-[11px] text-muted">
          এখান থেকে থিম পরিবর্তন করলে{" "}
          <b className="text-ink">সব ইউজার ও অ্যাডমিন</b> এর ড্যাশবোর্ডে সাথে
          সাথে প্রয়োগ হবে।
        </p>
        <PaletteBuilder />
      </Card>

      {/* FONT SIZE (admin's own) */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Type className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">আপনার টেক্সট আকার</h2>
        </div>
        <FontSizePicker />
        <p className="mt-3 text-[11px] text-subtle">
          শুধু আপনার ডিভাইসে কাজ করবে।
        </p>
      </Card>

      {/* INSTALL */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">
            অ্যাপ হিসেবে ইনস্টল
          </h2>
        </div>
        <div className="mt-2">
          <InstallButton size="lg" />
        </div>
        {installed && (
          <div className="mt-3 rounded-[10px] border border-success/40 bg-success/10 p-3 text-xs text-success">
            ✓ ইতিমধ্যে ইনস্টল করা আছে
          </div>
        )}
        {!canInstall && !installed && !isIOS && (
          <div className="mt-3 rounded-[10px] border border-line bg-surface/60 p-3 text-[11px] text-muted">
            <p className="font-medium text-ink">ব্রাউজার থেকে ইনস্টল:</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>
                <b className="text-ink">Chrome:</b> Address bar-এ ⊕ আইকন বা ⋮
                → Install app
              </li>
              <li>
                <b className="text-ink">Safari (iOS):</b> Share → Add to Home
                Screen
              </li>
            </ul>
          </div>
        )}
      </Card>

      {/* SUPER ADMIN INFO */}
      <Card variant="glass" className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">সুপার অ্যাডমিন</h2>
        </div>
        <div className="mt-3 rounded-[12px] border border-accent-strong/40 bg-accent/15 p-3 text-xs">
          <p className="text-ink">
            UID: <code>{SUPER_ADMIN_UID}</code>
          </p>
          <p className="mt-1 text-ink">
            ইমেইল: <code>{SUPER_ADMIN_EMAIL}</code>
          </p>
        </div>
        <p className="mt-3 text-xs text-muted">
          আপনার রোল: <b className="text-ink">{role}</b>
          {profile?.email ? ` (${profile.email})` : ""}
        </p>
      </Card>

      {/* GLOBAL PLATFORM SETTINGS */}
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
              মেইনটেন্যান্স মোড
            </label>

            {isSuperAdmin && (
              <Button onClick={save} loading={saving}>
                <Save className="h-4 w-4" />
                সংরক্ষণ
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}