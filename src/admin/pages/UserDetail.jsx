import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Ban, Check, Package, Clock, History, X,
  Eye, RefreshCw, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

import {
  getUser, updateUser, suspendUser, reactivateUser,
  listPackages,
} from "@/admin/services/adminService";
import {
  assignPackageToUser, listUserSubscriptions, cancelSubscription,
  extendSubscription, calcEndDate, renewSubscription,
} from "@/services/firebase/subscriptionService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate, toBanglaDateTime } from "@/utils/banglaDate";
import { calcAllPrices } from "@/config/pricing";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  AdminPageHeader, RoleBadge, StatusBadge,
} from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const BILLING_OPTIONS = [
  { id: "monthly",  label: "মাসিক",   days: 30 },
  { id: "yearly",   label: "বার্ষিক",  days: 365 },
  { id: "fiveYear", label: "৫ বছর",    days: 1825 },
  { id: "custom",   label: "কাস্টম",   days: 30 },
];

export default function UserDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, can } = useAuth();

  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [subs, setSubs] = useState([]);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [loadErrors, setLoadErrors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [assign, setAssign] = useState({
    packageId: "",
    billingPeriod: "monthly",
    customDays: 30,
    amountPaid: "",
    notes: "",
  });

  // Renew modal state
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewForm, setRenewForm] = useState({
    billingPeriod: "monthly",
    customDays: 30,
    amount: "",
    note: "",
  });
  const [renewing, setRenewing] = useState(false);

  const actor = {
    uid: profile?.uid,
    name: profile?.name,
    role: profile?.role,
  };

  /* ---------------- Load ---------------- */
  const load = async () => {
    setLoading(true);
    setLoadErrors([]);

    const errors = [];

    let u = null;
    try {
      u = await getUser(uid);
    } catch (err) {
      const m = getErrorMessage(err);
      errors.push(`ইউজার: ${m}`);
      if (import.meta.env.DEV) console.error("[UserDetail] user:", err);
    }

    let pkgs = [];
    try {
      pkgs = await listPackages({ max: 100 });
    } catch (err) {
      const m = getErrorMessage(err);
      errors.push(`প্যাকেজ: ${m}`);
      if (import.meta.env.DEV) console.error("[UserDetail] packages:", err);
    }

    let subscriptions = [];
    try {
      subscriptions = await listUserSubscriptions(uid, 15);
    } catch (err) {
      const m = getErrorMessage(err);
      errors.push(`সাবস্ক্রিপশন: ${m}`);
      if (import.meta.env.DEV) console.error("[UserDetail] subs:", err);
    }

    setUser(u);
    setEditName(u?.name || "");
    setEditPhone(u?.phone || "");
    setPackages((pkgs || []).filter((p) => p.active !== false));
    setSubs(subscriptions || []);
    setLoading(false);

    if (errors.length > 0) {
      setLoadErrors(errors);
      toast.error(errors[0]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  /* ---------------- Lazy workspace data ---------------- */
  const loadWorkspaceData = async () => {
    if (!user?.workspaceId || workspaceData) return;
    setLoadingWorkspace(true);
    try {
      const wId = user.workspaceId;
      const safeCount = (colName) =>
        getDocs(collection(db, "workspaces", wId, colName))
          .then((s) => s.size)
          .catch(() => 0);

      const [products, categories, customers, invoices] = await Promise.all([
        safeCount("products"),
        safeCount("categories"),
        safeCount("customers"),
        safeCount("invoices"),
      ]);
      setWorkspaceData({ products, categories, customers, invoices });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingWorkspace(false);
    }
  };

  /* ---------------- Derived ---------------- */
  const activeSub = useMemo(
    () => subs.find((s) => s.status === "active"),
    [subs]
  );

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === assign.packageId) || null,
    [packages, assign.packageId]
  );

  const previewPrices = useMemo(() => {
    if (!selectedPkg) return null;
    return calcAllPrices(selectedPkg, {});
  }, [selectedPkg]);

  const previewEndDate = useMemo(() => {
    const start = new Date();
    return calcEndDate(start, assign.billingPeriod, assign.customDays);
  }, [assign.billingPeriod, assign.customDays]);

  const previewDurationDays = useMemo(() => {
    const opt = BILLING_OPTIONS.find((o) => o.id === assign.billingPeriod);
    if (!opt) return 30;
    return assign.billingPeriod === "custom"
      ? Math.max(1, Number(assign.customDays) || 1)
      : opt.days;
  }, [assign.billingPeriod, assign.customDays]);

  /* ---------------- Actions ---------------- */
  const saveBasics = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, { name: editName, phone: editPhone }, actor);
      toast.success("আপডেট হয়েছে");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async () => {
    try {
      if (user.accountStatus === "suspended") {
        await reactivateUser(user.id, actor);
      } else {
        await suspendUser(user.id, actor);
      }
      toast.success("আপডেট হয়েছে");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAssign = async () => {
    if (!assign.packageId) return toast.error("প্যাকেজ নির্বাচন করুন");

    setSaving(true);
    try {
      await assignPackageToUser({
        userId: user.id,
        packageId: assign.packageId,
        billingPeriod: assign.billingPeriod,
        customDays: assign.customDays,
        amountPaid: Number(assign.amountPaid) || 0,
        notes: assign.notes || "",
        actor,
        workspaceId: user.workspaceId,
      });
      toast.success("প্যাকেজ অ্যাসাইন হয়েছে");
      setAssign({
        packageId: "",
        billingPeriod: "monthly",
        customDays: 30,
        amountPaid: "",
        notes: "",
      });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSub = async (subId) => {
    if (!confirm("এই সাবস্ক্রিপশন বাতিল করবেন?")) return;
    setBusy(subId);
    try {
      await cancelSubscription(subId, actor, "Admin cancelled");
      toast.success("বাতিল করা হয়েছে");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleExtendSub = async (subId, days) => {
    setBusy(subId);
    try {
      await extendSubscription(subId, days, actor);
      toast.success(`${toBanglaNumber(days)} দিন বাড়ানো হয়েছে`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleRenew = async () => {
    if (!renewForm.amount || Number(renewForm.amount) <= 0) {
      return toast.error("পেমেন্ট পরিমাণ দিন");
    }
    setRenewing(true);
    try {
      await renewSubscription({
        subscriptionId: activeSub.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        packageId: activeSub.packageId,
        packageName: activeSub.packageName,
        billingPeriod: renewForm.billingPeriod,
        customDays: renewForm.customDays,
        amount: Number(renewForm.amount),
        note: renewForm.note,
        actor,
      });
      toast.success("রিনিউ সফল — আর্নিং এ যোগ হয়েছে");
      setRenewOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRenewing(false);
    }
  };

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-surface-2" />
        <div className="h-20 animate-pulse rounded-[16px] bg-surface-2" />
        <div className="h-40 animate-pulse rounded-[16px] bg-surface-2" />
        <div className="h-40 animate-pulse rounded-[16px] bg-surface-2" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> ফিরে যান
        </button>

        <Card variant="glass" className="p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h2 className="mt-3 text-base font-semibold text-ink">
            ইউজার লোড করা যায়নি
          </h2>
          <p className="mt-1 text-sm text-muted">
            UID: <code className="text-ink">{uid}</code>
          </p>

          {loadErrors.length > 0 && (
            <div className="mx-auto mt-4 max-w-md space-y-1 rounded-[12px] border border-danger/40 bg-danger/10 p-3 text-left text-xs text-danger">
              {loadErrors.map((e, i) => (
                <p key={i}>• {e}</p>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              ফিরে যান
            </Button>
            <Button onClick={load}>
              <RefreshCw className="h-4 w-4" />
              আবার চেষ্টা করুন
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isSuper = user.role === "superAdmin";

  return (
    <div className="space-y-5 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> ফিরে যান
      </button>

      {loadErrors.length > 0 && (
        <div className="rounded-[12px] border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <p className="font-medium">কিছু ডেটা লোড করা যায়নি:</p>
          <ul className="mt-1 list-disc pl-4">
            {loadErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <AdminPageHeader
        title={user.name || "ইউজার"}
        subtitle={user.email}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role || "user"} />
            <StatusBadge status={user.accountStatus} />
            {user.packageId && (
              <span className="rounded-full border border-accent-strong/60 bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-ink">
                {activeSub?.packageName || user.packageId}
              </span>
            )}
            <Button size="sm" variant="secondary" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      {/* ============ Current subscription ============ */}
      {activeSub && (
        <Card variant="glass" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <h2 className="text-sm font-semibold text-ink">
              সক্রিয় সাবস্ক্রিপশন
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat
              label="প্যাকেজ"
              value={activeSub.packageName || activeSub.packageId}
            />
            <MiniStat
              label="বিলিং"
              value={getBillingLabel(activeSub.billingPeriod)}
            />
            <MiniStat
              label="শুরু"
              value={toBanglaDate(activeSub.startDate)}
            />
            <MiniStat
              label="মেয়াদ শেষ"
              value={toBanglaDate(activeSub.endDate)}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setRenewForm({
                  billingPeriod: activeSub.billingPeriod || "monthly",
                  customDays: 30,
                  amount: "",
                  note: "",
                });
                setRenewOpen(true);
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              রিনিউ + পেমেন্ট
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleExtendSub(activeSub.id, 30)}
              loading={busy === activeSub.id}
            >
              <Clock className="h-3.5 w-3.5" /> +৩০ দিন
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleExtendSub(activeSub.id, 365)}
              loading={busy === activeSub.id}
            >
              <Clock className="h-3.5 w-3.5" /> +১ বছর
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCancelSub(activeSub.id)}
              loading={busy === activeSub.id}
              className="text-danger"
            >
              <X className="h-3.5 w-3.5" /> বাতিল
            </Button>
          </div>
        </Card>
      )}

      {/* ============ Assign package ============ */}
      {can("subscriptions.manage") && (
        <Card variant="glass" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-accent-strong" />
            <h2 className="text-sm font-semibold text-ink">
              {activeSub ? "প্যাকেজ পরিবর্তন / নতুন" : "প্যাকেজ অ্যাসাইন"}
            </h2>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink">
              প্যাকেজ নির্বাচন
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => {
                const isSelected = assign.packageId === p.id;
                const prices = calcAllPrices(p, {});
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setAssign((a) => ({ ...a, packageId: p.id }))
                    }
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-[12px] border p-3 text-left transition-all",
                      isSelected
                        ? "border-accent-strong bg-accent/15 shadow-[var(--shadow-sm)]"
                        : "border-line bg-surface/50 hover:border-line-strong hover:bg-surface-2/60"
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {p.name}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-accent-strong" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted">
                      ৳{toBanglaNumber(prices.monthly.final)}/মাস
                    </span>
                  </button>
                );
              })}

              {packages.length === 0 && (
                <div className="col-span-full rounded-[12px] border border-dashed border-line p-4 text-center text-xs text-muted">
                  কোনো সক্রিয় প্যাকেজ নেই —{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/admin/packages")}
                    className="text-accent-strong underline"
                  >
                    প্যাকেজ তৈরি করুন
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[13px] font-medium text-ink">
              বিলিং সময়কাল
            </p>
            <div className="flex flex-wrap gap-2">
              {BILLING_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() =>
                    setAssign((a) => ({ ...a, billingPeriod: o.id }))
                  }
                  className={cn(
                    "rounded-[10px] border px-3 py-2 text-xs transition-colors",
                    assign.billingPeriod === o.id
                      ? "border-accent-strong bg-accent/20 text-ink"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {assign.billingPeriod === "custom" && (
            <div className="mt-3 max-w-[200px]">
              <Input
                label="দিন সংখ্যা"
                type="number"
                min="1"
                value={assign.customDays}
                onChange={(e) =>
                  setAssign((a) => ({
                    ...a,
                    customDays: Number(e.target.value),
                  }))
                }
              />
            </div>
          )}

          {selectedPkg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-[12px] border border-accent-strong/40 bg-accent/10 p-4"
            >
              <p className="label-xs mb-2">প্রিভিউ</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PreviewStat label="প্যাকেজ" value={selectedPkg.name} />
                <PreviewStat
                  label="মেয়াদ"
                  value={`${toBanglaNumber(previewDurationDays)} দিন`}
                />
                <PreviewStat
                  label="মেয়াদ শেষ"
                  value={toBanglaDate(previewEndDate)}
                />
                <PreviewStat
                  label="মূল্য"
                  value={
                    previewPrices
                      ? formatTaka(
                          getPriceForPeriod(
                            previewPrices,
                            assign.billingPeriod
                          )
                        )
                      : "—"
                  }
                />
              </div>
            </motion.div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="পরিশোধিত (৳)"
              type="number"
              min="0"
              value={assign.amountPaid}
              onChange={(e) =>
                setAssign((a) => ({ ...a, amountPaid: e.target.value }))
              }
              placeholder="ঐচ্ছিক"
            />
            <Input
              label="নোট"
              value={assign.notes}
              onChange={(e) =>
                setAssign((a) => ({ ...a, notes: e.target.value }))
              }
              placeholder="পেমেন্ট রেফারেন্স"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAssign}
              loading={saving}
              disabled={!assign.packageId}
            >
              <Package className="h-4 w-4" />
              {activeSub ? "পরিবর্তন করুন" : "অ্যাসাইন করুন"}
            </Button>
          </div>
        </Card>
      )}

      {/* ============ Basic info ============ */}
      <Card variant="glass" className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">মৌলিক তথ্য</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Input
              label="নাম"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="মোবাইল"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
            <div className="rounded-[12px] border border-line bg-surface/50 p-3 text-xs text-muted">
              <p>
                UID: <code className="text-ink">{user.id}</code>
              </p>
              <p className="mt-1">
                Workspace:{" "}
                <code className="text-ink">{user.workspaceId || "—"}</code>
              </p>
              <p className="mt-1">
                Verified: {user.emailVerified ? "হ্যাঁ" : "না"}
              </p>
              <p className="mt-1">
                যোগদান: {toBanglaDateTime(user.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={saveBasics}
                loading={saving}
                className="flex-1"
              >
                <Save className="h-4 w-4" /> সংরক্ষণ
              </Button>
              {!isSuper && can("users.suspend") && (
                <Button
                  variant={
                    user.accountStatus === "suspended" ? "secondary" : "danger"
                  }
                  onClick={toggleSuspend}
                >
                  {user.accountStatus === "suspended" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  {user.accountStatus === "suspended" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </Button>
              )}
            </div>
          </div>

          <div>
            {user.workspaceId && (
              <>
                <p className="mb-2 text-[13px] font-medium text-ink">
                  ওয়ার্কস্পেস ডেটা
                </p>
                {workspaceData ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "প্রোডাক্ট", v: workspaceData.products },
                      { l: "ক্যাটাগরি", v: workspaceData.categories },
                      { l: "কাস্টমার", v: workspaceData.customers },
                      { l: "ইনভয়েস", v: workspaceData.invoices },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="rounded-[10px] border border-line bg-surface/50 p-2.5"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted">
                          {s.l}
                        </p>
                        <p className="mt-0.5 text-base font-semibold text-ink">
                          {toBanglaNumber(s.v)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={loadWorkspaceData}
                    loading={loadingWorkspace}
                  >
                    <Eye className="h-4 w-4" />
                    ডেটা লোড করুন
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ============ Subscription history ============ */}
      <Card variant="glass" className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-accent-strong" />
          <h2 className="text-sm font-semibold text-ink">
            সাবস্ক্রিপশন ইতিহাস
          </h2>
        </div>

        {subs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            কোনো সাবস্ক্রিপশন নেই
          </p>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-[12px] border p-3",
                  s.status === "active"
                    ? "border-success/40 bg-success/5"
                    : s.status === "cancelled"
                    ? "border-danger/30 bg-danger/5"
                    : "border-line bg-surface/50"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {s.packageName || s.packageId}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {getBillingLabel(s.billingPeriod)} •{" "}
                    {toBanglaDate(s.startDate)} → {toBanglaDate(s.endDate)}
                  </p>
                  {s.amountPaid > 0 && (
                    <p className="mt-0.5 text-[11px] text-subtle">
                      পরিশোধ: {formatTaka(s.amountPaid)}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                    s.status === "active"
                      ? "border-success/40 bg-success/10 text-success"
                      : s.status === "cancelled"
                      ? "border-danger/40 bg-danger/10 text-danger"
                      : "border-line bg-surface-2 text-muted"
                  )}
                >
                  {s.status === "active"
                    ? "সক্রিয়"
                    : s.status === "cancelled"
                    ? "বাতিল"
                    : "মেয়াদোত্তীর্ণ"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ============ Renew modal ============ */}
      {renewOpen && activeSub && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !renewing && setRenewOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-strong relative w-full max-w-md rounded-[20px] p-5"
          >
            <h3 className="mb-1 text-base font-semibold text-ink">
              সাবস্ক্রিপশন রিনিউ
            </h3>
            <p className="mb-4 text-xs text-muted">
              {user.name} — {activeSub.packageName}
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  বিলিং সময়কাল
                </label>
                <div className="flex flex-wrap gap-2">
                  {BILLING_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() =>
                        setRenewForm((f) => ({ ...f, billingPeriod: o.id }))
                      }
                      className={cn(
                        "rounded-[10px] border px-3 py-1.5 text-xs transition-colors",
                        renewForm.billingPeriod === o.id
                          ? "border-accent-strong bg-accent/20 text-ink"
                          : "border-line bg-surface-2 text-muted hover:border-line-strong"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {renewForm.billingPeriod === "custom" && (
                <Input
                  label="দিন সংখ্যা"
                  type="number"
                  min="1"
                  value={renewForm.customDays}
                  onChange={(e) =>
                    setRenewForm((f) => ({
                      ...f,
                      customDays: Number(e.target.value),
                    }))
                  }
                />
              )}

              <Input
                label="পেমেন্ট পরিমাণ (৳)"
                type="number"
                min="0"
                value={renewForm.amount}
                onChange={(e) =>
                  setRenewForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="যত টাকা নিয়েছেন"
                required
              />

              <Input
                label="নোট (ঐচ্ছিক)"
                value={renewForm.note}
                onChange={(e) =>
                  setRenewForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="যেমন: bKash TrxID..."
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setRenewOpen(false)}
                disabled={renewing}
              >
                বাতিল
              </Button>
              <Button loading={renewing} onClick={handleRenew}>
                <RefreshCw className="h-4 w-4" />
                রিনিউ করুন
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value || "—"}</p>
    </div>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function getBillingLabel(periodId) {
  const o = BILLING_OPTIONS.find((x) => x.id === periodId);
  return o?.label || periodId || "—";
}

function getPriceForPeriod(prices, periodId) {
  if (!prices) return 0;
  switch (periodId) {
    case "monthly":
      return prices.monthly.final;
    case "yearly":
      return prices.yearly.final;
    case "fiveYear":
      return prices.fiveYear.final;
    default:
      return prices.monthly.final;
  }
}