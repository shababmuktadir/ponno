import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Percent, Save, RefreshCw, TrendingDown, Clock } from "lucide-react";
import {
  getPricingSettings, savePricingSettings,
} from "@/services/firebase/pricingService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBn, formatBDT, calcAllPrices } from "@/config/pricing";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { AdminPageHeader } from "@/admin/components/AdminUI";

const SAMPLE_PRICES = [650, 1200, 1800, 2400, 3000];

export default function PricingSettings() {
  const { profile, isAdmin } = useAuth();
  const [form, setForm] = useState({
    yearlyDiscount: 15,
    fiveYearDiscount: 30,
    currency: "BDT",
    currencySymbol: "৳",
    yearlyEnabled: true,
    fiveYearEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const actor = {
    uid: profile?.uid,
    name: profile?.name,
    role: profile?.role,
  };

  const load = async () => {
    setLoading(true);
    try {
      const s = await getPricingSettings();
      setForm((f) => ({ ...f, ...s }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    if (!isAdmin) return toast.error("শুধু অ্যাডমিন পরিবর্তন করতে পারে");
    setSaving(true);
    try {
      await savePricingSettings(form, actor);
      toast.success("সংরক্ষিত হয়েছে — সব প্যাকেজে প্রয়োগ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-5 pb-24">
      <AdminPageHeader
        title="মূল্য ও ছাড় সেটিংস"
        subtitle="সব প্যাকেজের জন্য গ্লোবাল ছাড় নিয়ন্ত্রণ করুন।"
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              রিফ্রেশ
            </Button>
            <Button onClick={onSave} loading={saving} disabled={!isAdmin}>
              <Save className="h-4 w-4" />
              সংরক্ষণ
            </Button>
          </>
        }
      />

      {/* ============ Global discounts ============ */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Percent className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">
            গ্লোবাল ছাড় সেটিংস
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-muted">লোড হচ্ছে…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="বার্ষিক ছাড় (%)"
              type="number"
              min="0"
              max="100"
              value={form.yearlyDiscount}
              onChange={(e) => update("yearlyDiscount", Number(e.target.value))}
              disabled={!isAdmin}
            />
            <Input
              label="৫ বছর ছাড় (%)"
              type="number"
              min="0"
              max="100"
              value={form.fiveYearDiscount}
              onChange={(e) => update("fiveYearDiscount", Number(e.target.value))}
              disabled={!isAdmin}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update("yearlyEnabled", !form.yearlyEnabled)}
            disabled={!isAdmin}
            className={
              form.yearlyEnabled
                ? "inline-flex items-center gap-1.5 rounded-[10px] border border-success/40 bg-success/10 px-3 py-2 text-xs text-success"
                : "inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-xs text-muted"
            }
          >
            <TrendingDown className="h-3.5 w-3.5" />
            বার্ষিক বিলিং {form.yearlyEnabled ? "চালু" : "বন্ধ"}
          </button>
          <button
            type="button"
            onClick={() => update("fiveYearEnabled", !form.fiveYearEnabled)}
            disabled={!isAdmin}
            className={
              form.fiveYearEnabled
                ? "inline-flex items-center gap-1.5 rounded-[10px] border border-success/40 bg-success/10 px-3 py-2 text-xs text-success"
                : "inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-xs text-muted"
            }
          >
            <Clock className="h-3.5 w-3.5" />
            ৫ বছর বিলিং {form.fiveYearEnabled ? "চালু" : "বন্ধ"}
          </button>
        </div>
      </Card>

      {/* ============ Currency ============ */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">মুদ্রা</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="মুদ্রা কোড"
            value={form.currency}
            onChange={(e) => update("currency", e.target.value.toUpperCase())}
            disabled={!isAdmin}
            maxLength={5}
          />
          <Input
            label="মুদ্রা চিহ্ন"
            value={form.currencySymbol}
            onChange={(e) => update("currencySymbol", e.target.value)}
            disabled={!isAdmin}
            maxLength={3}
          />
        </div>
      </Card>

      {/* ============ Preview ============ */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          ছাড়ের প্রভাব (স্যাম্পল মূল্যে)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-2 py-2 font-medium">মাসিক মূল্য</th>
                <th className="px-2 py-2 font-medium">বার্ষিক (মূল)</th>
                <th className="px-2 py-2 font-medium">বার্ষিক (ছাড়)</th>
                <th className="px-2 py-2 font-medium">৫ বছর (মূল)</th>
                <th className="px-2 py-2 font-medium">৫ বছর (ছাড়)</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_PRICES.map((mp) => {
                const p = calcAllPrices(
                  {
                    monthlyPrice: mp,
                    yearlyDiscount: form.yearlyDiscount,
                    fiveYearDiscount: form.fiveYearDiscount,
                  },
                  {}
                );
                return (
                  <tr key={mp} className="border-b border-line/60 last:border-0">
                    <td className="px-2 py-3 text-ink">{formatBDT(mp)}</td>
                    <td className="px-2 py-3 text-muted">
                      {formatBDT(p.yearly.base)}
                    </td>
                    <td className="px-2 py-3 text-ink">
                      {formatBDT(p.yearly.final)}
                      <span className="ml-1 text-[10px] text-success">
                        ({toBn(p.yearly.discountPct)}%)
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted">
                      {formatBDT(p.fiveYear.base)}
                    </td>
                    <td className="px-2 py-3 text-ink">
                      {formatBDT(p.fiveYear.final)}
                      <span className="ml-1 text-[10px] text-success">
                        ({toBn(p.fiveYear.discountPct)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}