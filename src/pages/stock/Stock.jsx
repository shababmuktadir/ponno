import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search, Boxes, RefreshCw, Plus, Lock, Trash2, X, Save,
  TrendingUp, TrendingDown, Settings2,
} from "lucide-react";

import useStock from "@/hooks/useStock";
import useProducts from "@/hooks/useProducts";
import usePermission from "@/hooks/usePermission";
import { TX_TYPES, TX_LABELS } from "@/services/firebase/stockService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate, toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const TX_TYPE_OPTIONS = [
  { id: TX_TYPES.PURCHASE,          label: "ক্রয়",       tone: "success" },
  { id: TX_TYPES.SALE,              label: "বিক্রয়",      tone: "accent" },
  { id: TX_TYPES.ADJUSTMENT_ADD,    label: "স্টক যোগ",    tone: "ink" },
  { id: TX_TYPES.ADJUSTMENT_REMOVE, label: "স্টক কমানো",  tone: "warning" },
];

export default function Stock() {
  const { can, canPage } = usePermission();
  const { transactions, loading, reload, create, remove } = useStock();
  const { products } = useProducts({ autoLoad: true });

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    type: TX_TYPES.PURCHASE,
    quantity: "",
    unitPrice: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const pageAllowed = canPage("stock");
  const canCreate = can("stock", "in") || can("stock", "out") || can("stock", "adjustment");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchType = filterType === "all" || t.type === filterType;
      const matchQ =
        !term ||
        (t.productName || "").toLowerCase().includes(term) ||
        (t.productModel || "").toLowerCase().includes(term) ||
        (t.categoryNameSnapshot || "").toLowerCase().includes(term);
      return matchType && matchQ;
    });
  }, [transactions, q, filterType]);

  if (!pageAllowed) return <UpgradePrompt pageId="stock" />;

  const selectedProduct = products.find((p) => p.id === form.productId);

  const openCreate = (type) => {
    setForm({
      productId: "",
      type: type || TX_TYPES.PURCHASE,
      quantity: "",
      unitPrice: "",
      note: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.productId) return toast.error("প্রোডাক্ট নির্বাচন করুন");
    if (Number(form.quantity) <= 0) return toast.error("পরিমাণ সঠিক নয়");
    if (Number(form.unitPrice) < 0) return toast.error("মূল্য সঠিক নয়");

    setSaving(true);
    try {
      await create({
        productId: form.productId,
        productName: selectedProduct?.name || "",
        productModel: selectedProduct?.model || "",
        categoryId: selectedProduct?.categoryId || null,
        categoryNameSnapshot: selectedProduct?.categoryNameSnapshot || "",
        type: form.type,
        quantity: Number(form.quantity) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        note: form.note || "",
        date: form.date || new Date().toISOString().slice(0, 10),
        source: "manual",
      });
      toast.success("ট্রানজেকশন যোগ হয়েছে");
      setShowForm(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm("এই ট্রানজেকশন মুছবেন? স্টক পুনরুদ্ধার হবে।")) return;
    try {
      await remove(t.id);
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            স্টক
          </h1>
          <p className="mt-1 text-sm text-muted">
            মোট {toBanglaNumber(transactions.length)}টি ট্রানজেকশন
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate ? (
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4" />
              নতুন ট্রানজেকশন
            </Button>
          ) : (
            <Button disabled>
              <Lock className="h-4 w-4" />
              অনুমতি নেই
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="প্রোডাক্ট, মডেল বা ক্যাটাগরি…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
          {[
            { v: "all", l: "সব" },
            { v: TX_TYPES.PURCHASE, l: "ক্রয়" },
            { v: TX_TYPES.SALE, l: "বিক্রয়" },
            { v: TX_TYPES.ADJUSTMENT_ADD, l: "যোগ" },
            { v: TX_TYPES.ADJUSTMENT_REMOVE, l: "কমানো" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilterType(f.v)}
              className={cn(
                "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors",
                filterType === f.v
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
          icon={Boxes}
          title={q || filterType !== "all" ? "কিছু পাওয়া যায়নি" : "এখনো কোনো ট্রানজেকশন নেই"}
          description="নতুন ক্রয় বা বিক্রয় যোগ করে শুরু করুন"
          action={
            canCreate ? (
              <Button onClick={() => openCreate()}>
                <Plus className="h-4 w-4" /> ট্রানজেকশন যোগ
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <Card variant="glass" className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">তারিখ</th>
                    <th className="px-4 py-3 font-medium">ধরন</th>
                    <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                    <th className="px-4 py-3 font-medium">পরিমাণ</th>
                    <th className="px-4 py-3 font-medium">দর</th>
                    <th className="px-4 py-3 font-medium">মোট</th>
                    <th className="px-4 py-3 text-right font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {toBanglaDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <TypePill type={t.type} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-ink">{t.productName}</p>
                        <p className="truncate text-[10px] text-muted">
                          {t.productModel}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {toBanglaNumber(t.quantity)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatTaka(t.unitPrice || 0)}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {formatTaka(t.totalAmount || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(t)}
                          className="rounded-[9px] p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-3 lg:hidden">
            {filtered.map((t) => (
              <Card key={t.id} variant="glass" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {t.productName}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {t.productModel} • {toBanglaDate(t.date)}
                    </p>
                  </div>
                  <TypePill type={t.type} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[10px] border border-line bg-surface/50 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted">পরিমাণ</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">
                      {toBanglaNumber(t.quantity)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-line bg-surface/50 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted">দর</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">
                      {formatTaka(t.unitPrice || 0)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-line bg-surface/50 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted">মোট</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">
                      {formatTaka(t.totalAmount || 0)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(t)}
                  className="mt-3 w-full rounded-[10px] border border-danger/40 py-1.5 text-xs text-danger hover:bg-danger/10"
                >
                  <Trash2 className="mr-1 inline h-3 w-3" /> মুছুন
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)}>
            <h3 className="mb-4 text-base font-semibold text-ink">
              নতুন স্টক ট্রানজেকশন
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  ধরন
                </label>
                <div className="flex flex-wrap gap-2">
                  {TX_TYPE_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: o.id }))}
                      className={cn(
                        "rounded-[10px] border px-3 py-1.5 text-xs transition-colors",
                        form.type === o.id
                          ? "border-accent-strong bg-accent/20 text-ink"
                          : "border-line bg-surface-2 text-muted hover:border-line-strong"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  প্রোডাক্ট
                </label>
                <select
                  value={form.productId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productId: e.target.value }))
                  }
                  className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink focus:border-accent-strong/70 focus:outline-none"
                >
                  <option value="">নির্বাচন করুন</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.model || "—"}) — স্টক {p.currentStock || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="পরিমাণ"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  required
                />
                <Input
                  label="ইউনিট দর (৳)"
                  type="number"
                  min="0"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitPrice: e.target.value }))
                  }
                />
              </div>

              <Input
                label="তারিখ"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />

              <Input
                label="নোট"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />

              <div className="rounded-[10px] border border-line bg-surface/40 p-3 text-xs text-muted">
                <p>
                  মোট:{" "}
                  <b className="text-ink">
                    {formatTaka(
                      (Number(form.quantity) || 0) *
                        (Number(form.unitPrice) || 0)
                    )}
                  </b>
                </p>
                {selectedProduct && (
                  <p className="mt-1">
                    বর্তমান স্টক: {toBanglaNumber(selectedProduct.currentStock || 0)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                বাতিল
              </Button>
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" /> সংরক্ষণ
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypePill({ type }) {
  const map = {
    [TX_TYPES.PURCHASE]: {
      label: "ক্রয়",
      icon: TrendingUp,
      cls: "border-success/40 bg-success/10 text-success",
    },
    [TX_TYPES.SALE]: {
      label: "বিক্রয়",
      icon: TrendingDown,
      cls: "border-accent-strong/60 bg-accent/20 text-ink",
    },
    [TX_TYPES.ADJUSTMENT_ADD]: {
      label: "+ অ্যাডজাস্ট",
      icon: Settings2,
      cls: "border-line bg-surface-2 text-muted",
    },
    [TX_TYPES.ADJUSTMENT_REMOVE]: {
      label: "− অ্যাডজাস্ট",
      icon: Settings2,
      cls: "border-warning/40 bg-warning/10 text-warning",
    },
  };
  const it = map[type] || map[TX_TYPES.PURCHASE];
  const Icon = it.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        it.cls
      )}
    >
      <Icon className="h-3 w-3" />
      {it.label}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative my-8 w-full max-w-md rounded-[20px] p-5"
      >
        {children}
      </motion.div>
    </div>
  );
}