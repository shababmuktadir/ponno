import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus, Package as PackageIcon, Trash2, Edit3, Copy, Check, X as XIcon,
  Star, RefreshCw, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  listPackages, seedDefaultPackages, deletePackage, duplicatePackage,
  togglePackageActive,
} from "@/services/firebase/packageService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { formatBDT, toBn, calcAllPrices } from "@/config/pricing";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, ConfirmDialog } from "@/admin/components/AdminUI";

export default function Packages() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const actor = {
    uid: profile?.uid || profile?.id,
    name: profile?.name,
    role: profile?.role,
  };

  const load = async () => {
    setLoading(true);
    try {
      const list = await listPackages({ max: 100 });
      setRows(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSeed = async () => {
    setBusy("seed");
    try {
      const n = await seedDefaultPackages(actor, { overwrite: false });
      toast.success(`${toBn(n)}টি প্যাকেজ তৈরি হয়েছে`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onToggleActive = async (id, active) => {
    setBusy(id);
    try {
      await togglePackageActive(id, active, actor);
      toast.success(active ? "সক্রিয় করা হয়েছে" : "নিষ্ক্রিয় করা হয়েছে");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onDuplicate = async (id) => {
    setBusy(id);
    try {
      await duplicatePackage(id, actor);
      toast.success("কপি তৈরি হয়েছে");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onDelete = (id) => {
    setConfirm({
      title: "প্যাকেজ মুছবেন?",
      message: "এই ক্রিয়া ফিরিয়ে আনা যাবে না।",
      danger: true,
      onConfirm: async () => {
        try {
          await deletePackage(id, actor);
          toast.success("মুছে ফেলা হয়েছে");
          setConfirm(null);
          load();
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="প্যাকেজ ম্যানেজমেন্ট"
        subtitle="৫টি প্যাকেজ তৈরি, সম্পাদনা ও মূল্য নির্ধারণ করুন।"
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              রিফ্রেশ
            </Button>
            {rows.length === 0 && !loading && (
              <Button variant="secondary" onClick={onSeed} loading={busy === "seed"}>
                <PackageIcon className="h-4 w-4" />
                ডিফল্ট ৫টি প্যাকেজ তৈরি
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => navigate("/admin/packages/new")}>
                <Plus className="h-4 w-4" />
                নতুন প্যাকেজ
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">
          লোড হচ্ছে…
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="এখনো কোনো প্যাকেজ নেই"
          description="ডিফল্ট ৫টি প্যাকেজ তৈরি করুন অথবা নতুন প্যাকেজ বানান।"
          action={
            <Button onClick={onSeed} loading={busy === "seed"}>
              <PackageIcon className="h-4 w-4" />
              ডিফল্ট প্যাকেজ তৈরি করুন
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p, i) => (
            <PackageRowCard
              key={p.id}
              pkg={p}
              index={i}
              busy={busy === p.id}
              onEdit={() => navigate(`/admin/packages/${p.id}`)}
              onDuplicate={() => onDuplicate(p.id)}
              onDelete={() => onDelete(p.id)}
              onToggleActive={(v) => onToggleActive(p.id, v)}
            />
          ))}
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

/* ================================================================== */

function PackageRowCard({ pkg, index, busy, onEdit, onDuplicate, onDelete, onToggleActive }) {
  const prices = calcAllPrices(pkg, {});
  const active = pkg.active !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i2(index) }}
    >
      <Card variant="glass" className="relative overflow-hidden p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-lg font-bold"
              style={{
                background: `${pkg.color || "#C9B994"}22`,
                color: pkg.color || "#C9B994",
              }}
            >
              {pkg.name?.[0] || "?"}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{pkg.name}</p>
              {pkg.badge && (
                <p className="mt-0.5 text-[10px] text-muted">{pkg.badge}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {pkg.popular && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
                <Star className="h-3 w-3" />
              </span>
            )}
            <span
              className={
                active
                  ? "rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success"
                  : "rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted"
              }
            >
              {active ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
          </div>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="mt-3 line-clamp-2 text-xs text-muted">
            {pkg.description}
          </p>
        )}

        {/* Pricing */}
        <div className="mt-4 space-y-1.5 rounded-[12px] border border-line bg-surface/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">মাসিক</span>
            <span className="text-sm font-semibold text-ink">
              {formatBDT(prices.monthly.final)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">
              বার্ষিক ({toBn(prices.yearly.discountPct)}% ছাড়)
            </span>
            <span className="text-xs text-ink">
              {formatBDT(prices.yearly.final)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">
              ৫ বছর ({toBn(prices.fiveYear.discountPct)}% ছাড়)
            </span>
            <span className="text-xs text-ink">
              {formatBDT(prices.fiveYear.final)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onEdit} className="flex-1">
            <Edit3 className="h-3.5 w-3.5" />
            এডিট
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onDuplicate}
            disabled={busy}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onToggleActive(!active)}
            disabled={busy}
          >
            {active ? <XIcon className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onDelete}
            disabled={busy}
            className="text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function i2(index) {
  return Math.min(index * 0.05, 0.3);
}