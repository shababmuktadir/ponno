import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, Search, Receipt, Trash2, RefreshCw, Lock, Check, Eye,
} from "lucide-react";

import useInvoices from "@/hooks/useInvoices";
import usePermission from "@/hooks/usePermission";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const STATUS_STYLE = {
  draft: "border-line bg-surface-2 text-muted",
  finalized: "border-success/40 bg-success/10 text-success",
};

export default function Invoices() {
  const navigate = useNavigate();
  const { can, canPage } = usePermission();
  const { invoices, loading, reload, remove, finalize } = useInvoices();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const pageAllowed = canPage("invoice");
  const canCreate = can("invoice", "create");
  const canDelete = can("invoice", "delete");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchQ =
        !t ||
        (inv.invoiceNumber || "").toLowerCase().includes(t) ||
        (inv.customerName || "").toLowerCase().includes(t) ||
        (inv.customerPhone || "").includes(t);
      const matchF = filter === "all" || inv.status === filter;
      return matchQ && matchF;
    });
  }, [invoices, q, filter]);

  if (!pageAllowed) return <UpgradePrompt pageId="invoice" />;

  const handleDelete = async (inv) => {
    if (!confirm(`ইনভয়েস #${inv.invoiceNumber} মুছবেন?`)) return;
    try {
      await remove(inv.id);
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleFinalize = async (inv) => {
    if (
      !confirm(
        `ইনভয়েস #${inv.invoiceNumber} finalize করবেন? স্টক কমে যাবে এবং এটি পরিবর্তন করা যাবে না।`
      )
    )
      return;
    try {
      await finalize(inv.id);
      toast.success("Finalize হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            ইনভয়েস
          </h1>
          <p className="mt-1 text-sm text-muted">
            মোট {toBanglaNumber(invoices.length)}টি
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate ? (
            <Button onClick={() => navigate("/invoices/new")}>
              <Plus className="h-4 w-4" />
              নতুন ইনভয়েস
            </Button>
          ) : (
            <Button disabled>
              <Lock className="h-4 w-4" />
              অনুমতি নেই
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="ইনভয়েস নম্বর, কাস্টমার…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
          {[
            { v: "all", l: "সব" },
            { v: "draft", l: "ড্রাফট" },
            { v: "finalized", l: "Finalized" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={cn(
                "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.v
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="কোনো ইনভয়েস নেই"
          description="নতুন ইনভয়েস তৈরি করে শুরু করুন"
          action={
            canCreate ? (
              <Button onClick={() => navigate("/invoices/new")}>
                <Plus className="h-4 w-4" /> নতুন ইনভয়েস
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
            >
              <Card variant="glass" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      #{inv.invoiceNumber}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {inv.customerName || "সাধারণ ক্রেতা"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-subtle">
                      {toBanglaDate(inv.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      STATUS_STYLE[inv.status] || STATUS_STYLE.draft
                    )}
                  >
                    {inv.status === "finalized" ? "Finalized" : "ড্রাফট"}
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      সর্বমোট
                    </p>
                    <p className="text-lg font-semibold text-ink">
                      {formatTaka(inv.grandTotal || 0)}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted">
                    আইটেম: {toBanglaNumber(inv.items?.length || 0)}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    as={Link}
                    to={`/invoices/${inv.id}`}
                    className="flex-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    দেখুন
                  </Button>
                  {inv.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => handleFinalize(inv)}
                      className="flex-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Finalize
                    </Button>
                  )}
                  {inv.status === "draft" && canDelete && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(inv)}
                      className="text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}