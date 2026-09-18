import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MessageSquare, Send, RefreshCw, Search, Trash2, Wallet,
  CheckCircle2, XCircle, Users, Lock, ChevronDown, ChevronUp, X,
} from "lucide-react";

import useSms from "@/hooks/useSms";
import useCustomers from "@/hooks/useCustomers";
import usePermission from "@/hooks/usePermission";
import useUsage from "@/hooks/useUsage";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDateTime } from "@/utils/banglaDate";
import { normalizePhoneForSMS } from "@/services/api/smsService";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import FeatureLimit from "@/components/package/FeatureLimit";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const SMS_MAX_LENGTH = 160;
const MULTI_PART_MAX = 1000;

export default function Sms() {
  const { canPage, can } = usePermission();
  const { history, loading, balance, balanceLoading, reload, send, remove, fetchBalance } =
    useSms();
  const { customers } = useCustomers({ autoLoad: true });
  const { isExceeded } = useUsage("sms", "smsLimit");

  const [tab, setTab] = useState("compose"); // compose | history
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [recipientMode, setRecipientMode] = useState("single"); // single | multiple | manual
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [manualPhone, setManualPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Customer search
  const [custSearch, setCustSearch] = useState("");

  const pageAllowed = canPage("sms");
  const canSend = can("sms", "send") && !isExceeded;

  const filteredCustomers = useMemo(() => {
    const t = custSearch.trim().toLowerCase();
    if (!t) return customers.slice(0, 50);
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(t) ||
        (c.phone || "").includes(t)
    );
  }, [customers, custSearch]);

  const filteredHistory = useMemo(() => {
    const t = search.trim().toLowerCase();
    return history.filter((h) => {
      const matchQ =
        !t ||
        (h.customerName || "").toLowerCase().includes(t) ||
        (h.phone || "").includes(t) ||
        (h.message || "").toLowerCase().includes(t);
      const matchF = filterStatus === "all" || h.status === filterStatus;
      return matchQ && matchF;
    });
  }, [history, search, filterStatus]);

  if (!pageAllowed) return <UpgradePrompt pageId="sms" />;

  /* -------- send handlers -------- */

  const toggleCustomer = (id) => {
    const next = new Set(selectedCustomers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCustomers(next);
  };

  const sendToCustomer = async (customer) => {
    if (!customer.phone) return toast.error("এই কাস্টমারের ফোন নেই");
    return send({
      phone: customer.phone,
      message,
      customerId: customer.id,
      customerName: customer.name,
    });
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error("বার্তা লিখুন");

    if (recipientMode === "manual") {
      if (!manualPhone.trim()) return toast.error("ফোন নাম্বার দিন");
      const normalized = normalizePhoneForSMS(manualPhone);
      if (!/^8801\d{9}$/.test(normalized)) {
        return toast.error("ফোন নাম্বার সঠিক নয় (01XXXXXXXXX)");
      }
      setSending(true);
      try {
        await send({ phone: normalized, message });
        toast.success("SMS পাঠানো হয়েছে");
        setManualPhone("");
        setMessage("");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setSending(false);
      }
      return;
    }

    // Single or multiple
    const chosen = customers.filter((c) => selectedCustomers.has(c.id));
    if (chosen.length === 0) return toast.error("কাস্টমার নির্বাচন করুন");

    const withPhone = chosen.filter((c) => c.phone);
    if (withPhone.length === 0) return toast.error("নির্বাচিত কাস্টমারদের ফোন নেই");

    setSending(true);
    setProgress({ current: 0, total: withPhone.length });

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < withPhone.length; i++) {
      const c = withPhone[i];
      try {
        await sendToCustomer(c);
        sent++;
      } catch (err) {
        failed++;
        errors.push(`${c.name}: ${getErrorMessage(err)}`);
      }
      setProgress({ current: i + 1, total: withPhone.length });
      // rate limit — 250ms
      await new Promise((r) => setTimeout(r, 250));
    }

    setSending(false);
    setProgress({ current: 0, total: 0 });

    if (failed === 0) {
      toast.success(`${toBanglaNumber(sent)}টি SMS পাঠানো হয়েছে`);
      setSelectedCustomers(new Set());
      setMessage("");
    } else {
      toast.error(
        `সফল: ${toBanglaNumber(sent)}, ব্যর্থ: ${toBanglaNumber(failed)}`
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("এই SMS রেকর্ড মুছবেন?")) return;
    try {
      await remove(id);
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const selectedCount = selectedCustomers.size;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            এসএমএস
          </h1>
          <p className="mt-1 text-sm text-muted">
            কাস্টমারকে SMS পাঠান, ইতিহাস দেখুন
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Balance pill */}
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 backdrop-blur-md">
            <Wallet className="h-3.5 w-3.5 text-accent-strong" />
            <span className="text-xs text-muted">ব্যালেন্স:</span>
            <span className="text-xs font-medium text-ink">
              {balanceLoading
                ? "…"
                : balance != null
                ? `৳ ${toBanglaNumber(Math.round(balance * 100) / 100)}`
                : "—"}
            </span>
            <button
              onClick={fetchBalance}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              title="রিফ্রেশ"
            >
              <RefreshCw
                className={cn("h-3 w-3", balanceLoading && "animate-spin")}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Usage bar */}
      <Card variant="glass" className="p-4">
        <FeatureLimit usageKey="sms" limitKey="smsLimit" label="মাসিক SMS সীমা" />
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
        <button
          onClick={() => setTab("compose")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
            tab === "compose"
              ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
              : "text-muted hover:text-ink"
          )}
        >
          <Send className="h-3.5 w-3.5" />
          নতুন SMS
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
            tab === "history"
              ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
              : "text-muted hover:text-ink"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          ইতিহাস ({toBanglaNumber(history.length)})
        </button>
      </div>

      {/* ==================== COMPOSE TAB ==================== */}
      {tab === "compose" && (
        <div className="space-y-4">
          {/* Recipient mode */}
          <Card variant="glass" className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">প্রাপক</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { v: "single", l: "একজন কাস্টমার" },
                { v: "multiple", l: "একাধিক কাস্টমার" },
                { v: "manual", l: "নিজে লিখুন" },
              ].map((m) => (
                <button
                  key={m.v}
                  onClick={() => {
                    setRecipientMode(m.v);
                    setSelectedCustomers(new Set());
                  }}
                  className={cn(
                    "rounded-[10px] border px-3 py-2 text-xs transition-colors",
                    recipientMode === m.v
                      ? "border-accent-strong bg-accent/20 text-ink"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong"
                  )}
                >
                  {m.l}
                </button>
              ))}
            </div>

            {/* Manual phone */}
            {recipientMode === "manual" && (
              <div className="mt-4">
                <Input
                  label="ফোন নাম্বার"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            )}

            {/* Customer picker */}
            {recipientMode !== "manual" && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-ink">
                    কাস্টমার নির্বাচন
                  </p>
                  {selectedCount > 0 && (
                    <span className="rounded-full border border-accent-strong/50 bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-ink">
                      {toBanglaNumber(selectedCount)} জন
                    </span>
                  )}
                </div>

                <Input
                  placeholder="নাম বা ফোন…"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />

                <div className="mt-3 max-h-72 overflow-y-auto rounded-[12px] border border-line bg-surface/40 p-2">
                  {filteredCustomers.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted">
                      কোনো কাস্টমার নেই
                    </p>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isSelected = selectedCustomers.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (recipientMode === "single") {
                              setSelectedCustomers(new Set([c.id]));
                            } else {
                              toggleCustomer(c.id);
                            }
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[10px] p-2 text-left transition-colors",
                            isSelected
                              ? "bg-accent/20 ring-1 ring-accent-strong/50"
                              : "hover:bg-surface-2/60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-xs font-semibold",
                              isSelected
                                ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                                : "bg-surface-2 text-muted"
                            )}
                          >
                            {isSelected ? "✓" : (c.name || "?").charAt(0)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-ink">
                              {c.name}
                            </p>
                            <p className="truncate text-[11px] text-muted">
                              {c.phone
                                ? toBanglaNumber(c.phone)
                                : "ফোন নেই"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Message */}
          <Card variant="glass" className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">বার্তা</h2>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="SMS বার্তা লিখুন…"
              maxLength={MULTI_PART_MAX}
              className="w-full rounded-[12px] border border-line bg-surface/70 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent-strong/70"
            />
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-muted">
                অক্ষর: {toBanglaNumber(message.length)} /{" "}
                {toBanglaNumber(SMS_MAX_LENGTH)}
                {message.length > SMS_MAX_LENGTH && (
                  <span className="ml-1 text-warning">
                    ({Math.ceil(message.length / SMS_MAX_LENGTH)}টি SMS)
                  </span>
                )}
              </span>
              {message.length <= SMS_MAX_LENGTH && (
                <span className="text-success">১টি SMS</span>
              )}
            </div>

            {/* Progress */}
            {sending && progress.total > 0 && (
              <div className="mt-3 rounded-[10px] border border-line bg-surface/50 p-3 text-xs">
                <p className="mb-1 text-ink">
                  পাঠানো হচ্ছে: {toBanglaNumber(progress.current)} /{" "}
                  {toBanglaNumber(progress.total)}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-accent-strong transition-all"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={!canSend || !message.trim()}
              >
                {canSend ? (
                  <>
                    <Send className="h-4 w-4" />
                    পাঠান
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    সীমা শেষ
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== HISTORY TAB ==================== */}
      {tab === "history" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                placeholder="নাম, ফোন বা বার্তা…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
              {[
                { v: "all", l: "সব" },
                { v: "sent", l: "সফল" },
                { v: "failed", l: "ব্যর্থ" },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFilterStatus(f.v)}
                  className={cn(
                    "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors",
                    filterStatus === f.v
                      ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Card variant="glass" className="p-8 text-center text-sm text-muted">
              লোড হচ্ছে…
            </Card>
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={search ? "কিছু পাওয়া যায়নি" : "এখনো কোনো SMS পাঠানো হয়নি"}
              description={
                search ? "অন্য কিছু দিয়ে খুঁজুন" : "নতুন SMS পাঠিয়ে শুরু করুন"
              }
              action={
                !search ? (
                  <Button onClick={() => setTab("compose")}>
                    <Send className="h-4 w-4" />
                    নতুন SMS
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                >
                  <Card variant="glass" className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              h.status === "sent"
                                ? "border-success/40 bg-success/10 text-success"
                                : "border-danger/40 bg-danger/10 text-danger"
                            )}
                          >
                            {h.status === "sent" ? (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            ) : (
                              <XCircle className="h-2.5 w-2.5" />
                            )}
                            {h.status === "sent" ? "সফল" : "ব্যর্থ"}
                          </span>
                          {h.customerName && (
                            <span className="text-xs font-medium text-ink">
                              {h.customerName}
                            </span>
                          )}
                          <span className="text-[11px] text-muted">
                            {toBanglaNumber(h.phone)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-ink">{h.message}</p>
                        <p className="mt-1 text-[10px] text-subtle">
                          {toBanglaDateTime(h.sentAt)}
                        </p>
                        {h.errorMessage && (
                          <p className="mt-1 text-[10px] text-danger">
                            {h.errorMessage}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="shrink-0 rounded-[9px] p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}