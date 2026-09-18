import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Plus, Trash2, Printer, Download, Check, X,
  Search, Lock,
} from "lucide-react";
import { motion } from "framer-motion";

import useInvoices from "@/hooks/useInvoices";
import useProducts from "@/hooks/useProducts";
import useCustomers from "@/hooks/useCustomers";
import usePermission from "@/hooks/usePermission";
import useBranding from "@/hooks/useBranding";
import { getInvoice, computeInvoiceTotals } from "@/services/firebase/invoiceService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { downloadElementAsPDF, printElement } from "@/utils/pdf/pdfGenerator";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InvoiceTemplate from "@/components/pdf/InvoiceTemplate";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const EMPTY_ITEM = {
  productId: "",
  productName: "",
  productModel: "",
  categoryId: null,
  categoryNameSnapshot: "",
  quantity: 1,
  unitPrice: 0,
  total: 0,
};

export default function InvoiceEditor() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { canPage, can } = usePermission();
  const { create, update, finalize } = useInvoices({ autoLoad: false });
  const { products } = useProducts({ autoLoad: true });
  const { customers } = useCustomers({ autoLoad: true });
  const branding = useBranding();

  const pdfRef = useRef(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const [form, setForm] = useState({
    invoiceNumber: "",
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    items: [{ ...EMPTY_ITEM }],
    discountAmount: 0,
    taxPct: 0,
    amountPaid: 0,
    paymentStatus: "unpaid",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerItemIndex, setPickerItemIndex] = useState(null);

  const pageAllowed = canPage("invoice");
  const canEdit = can("invoice", "edit") || isNew;
  const isFinalized = invoice?.status === "finalized";

  /* -------- Load existing -------- */
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const { workspaceId } = await import("@/config/firebase").then((m) => ({
          workspaceId: null,
        }));
      } catch {}
    })();
  }, [isNew]);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const { auth } = await import("@/config/firebase");
        const { db } = await import("@/config/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const me = await getDoc(doc(db, "users", auth.currentUser.uid));
        const wId = me.data()?.workspaceId;
        if (!wId) throw new Error("ওয়ার্কস্পেস নেই");
        const inv = await getInvoice(wId, id);
        if (!inv) {
          toast.error("ইনভয়েস পাওয়া যায়নি");
          navigate("/invoices");
          return;
        }
        if (!cancel) {
          setInvoice(inv);
          setForm({
            invoiceNumber: inv.invoiceNumber || "",
            customerId: inv.customerId || "",
            customerName: inv.customerName || "",
            customerPhone: inv.customerPhone || "",
            customerEmail: inv.customerEmail || "",
            customerAddress: inv.customerAddress || "",
            items: inv.items?.length ? inv.items : [{ ...EMPTY_ITEM }],
            discountAmount: inv.discountAmount || 0,
            taxPct: inv.taxPct || 0,
            amountPaid: inv.amountPaid || 0,
            paymentStatus: inv.paymentStatus || "unpaid",
            note: inv.note || "",
            date: inv.date || new Date().toISOString().slice(0, 10),
          });
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

  /* -------- Totals -------- */
  const totals = useMemo(
    () => computeInvoiceTotals(form.items, form.discountAmount, form.taxPct),
    [form.items, form.discountAmount, form.taxPct]
  );

  const due = Math.max(0, totals.grandTotal - (Number(form.amountPaid) || 0));

  const computedPaymentStatus = useMemo(() => {
    const paid = Number(form.amountPaid) || 0;
    if (paid <= 0) return "unpaid";
    if (paid >= totals.grandTotal) return "paid";
    return "partial";
  }, [form.amountPaid, totals.grandTotal]);

  /* -------- Item handlers -------- */
  const updateItem = (index, patch) => {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], ...patch };
      const q = Number(items[index].quantity) || 0;
      const p = Number(items[index].unitPrice) || 0;
      items[index].total = q * p;
      return { ...f, items };
    });
  };

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  };

  const removeItem = (index) => {
    setForm((f) => {
      const items = f.items.filter((_, i) => i !== index);
      return { ...f, items: items.length ? items : [{ ...EMPTY_ITEM }] };
    });
  };

  const openProductPicker = (index) => {
    setPickerItemIndex(index);
    setProductSearch("");
    setShowProductPicker(true);
  };

  const pickProduct = (p) => {
    if (pickerItemIndex === null) return;
    updateItem(pickerItemIndex, {
      productId: p.id,
      productName: p.name,
      productModel: p.model || "",
      categoryId: p.categoryId || null,
      categoryNameSnapshot: p.categoryNameSnapshot || "",
      unitPrice: p.sellUnitPrice || 0,
      quantity: 1,
      total: p.sellUnitPrice || 0,
    });
    setShowProductPicker(false);
    setPickerItemIndex(null);
  };

  /* -------- Customer picker -------- */
  const pickCustomer = (c) => {
    setForm((f) => ({
      ...f,
      customerId: c.id,
      customerName: c.name || "",
      customerPhone: c.phone || "",
      customerEmail: c.email || "",
      customerAddress: c.address || "",
    }));
  };

  /* -------- Save -------- */
  const handleSave = async () => {
    if (form.items.every((it) => !it.productId)) {
      return toast.error("কমপক্ষে ১টি প্রোডাক্ট যোগ করুন");
    }
    if (form.items.some((it) => !it.productId)) {
      return toast.error("সব আইটেমে প্রোডাক্ট নির্বাচন করুন");
    }

    setSaving(true);
    try {
      const payload = {
        invoiceNumber: form.invoiceNumber,
        customerId: form.customerId || null,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        items: form.items,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxPct: Number(form.taxPct) || 0,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        amountPaid: Number(form.amountPaid) || 0,
        paymentStatus: computedPaymentStatus,
        note: form.note,
        date: form.date,
      };

      if (isNew) {
        const newId = await create(payload);
        toast.success("ইনভয়েস তৈরি হয়েছে");
        navigate(`/invoices/${newId}`, { replace: true });
      } else {
        await update(id, payload);
        toast.success("সংরক্ষিত হয়েছে");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!confirm("Finalize করলে স্টক কমে যাবে এবং আর পরিবর্তন করা যাবে না। চালিয়ে যাবেন?"))
      return;
    try {
      await finalize(id);
      toast.success("Finalize হয়েছে");
      // reload page state
      window.location.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* -------- PDF -------- */
  const handleDownloadPDF = async () => {
    try {
      const el = pdfRef.current;
      if (!el) return;
      const filename = `${form.invoiceNumber || "invoice"}.pdf`;
      await downloadElementAsPDF(el, filename);
      toast.success("PDF ডাউনলোড হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePrint = () => {
    try {
      printElement(pdfRef.current, form.invoiceNumber);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* -------- Filter products -------- */
  const filteredProducts = useMemo(() => {
    const t = productSearch.trim().toLowerCase();
    if (!t) return products.slice(0, 30);
    return products
      .filter(
        (p) =>
          (p.name || "").toLowerCase().includes(t) ||
          (p.model || "").toLowerCase().includes(t)
      )
      .slice(0, 30);
  }, [products, productSearch]);

  if (!pageAllowed) return <UpgradePrompt pageId="invoice" />;

  if (loading) {
    return (
      <Card variant="glass" className="p-8 text-center text-sm text-muted">
        লোড হচ্ছে…
      </Card>
    );
  }

  const invoiceForTemplate = {
    ...form,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    grandTotal: totals.grandTotal,
    paymentStatus: computedPaymentStatus,
  };

  return (
    <div className="space-y-5 pb-32">
      <div className="no-print">
        <button
          onClick={() => navigate("/invoices")}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> ইনভয়েস লিস্টে ফিরে যান
        </button>
      </div>

      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {isNew ? "নতুন ইনভয়েস" : `ইনভয়েস #${form.invoiceNumber}`}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isFinalized
              ? "Finalized — পরিবর্তন করা যাবে না"
              : "ড্রাফট — সম্পাদনা করতে পারবেন"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            প্রিন্ট
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          {!isFinalized && !isNew && (
            <Button onClick={handleFinalize}>
              <Check className="h-4 w-4" />
              Finalize
            </Button>
          )}
          {!isFinalized && (
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              সংরক্ষণ
            </Button>
          )}
        </div>
      </header>

      {!isFinalized && (
        <Card variant="glass" className="no-print p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">ইনভয়েস তথ্য</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="তারিখ"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="ইনভয়েস নম্বর (ঐচ্ছিক)"
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
              }
              placeholder="খালি রাখলে স্বয়ংক্রিয় হবে"
            />
          </div>

          {/* Customer selector */}
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-medium text-ink">
              কাস্টমার (ঐচ্ছিক)
            </p>
            <select
              value={form.customerId}
              onChange={(e) => {
                const c = customers.find((x) => x.id === e.target.value);
                if (c) pickCustomer(c);
                else
                  setForm((f) => ({
                    ...f,
                    customerId: "",
                    customerName: "",
                    customerPhone: "",
                    customerEmail: "",
                    customerAddress: "",
                  }));
              }}
              className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink focus:border-accent-strong/70 focus:outline-none"
            >
              <option value="">সাধারণ ক্রেতা / নতুন নাম লিখুন</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone || "—"}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="কাস্টমার নাম"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
            />
            <Input
              label="ফোন"
              value={form.customerPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerPhone: e.target.value }))
              }
            />
            <Input
              label="ইমেইল"
              type="email"
              value={form.customerEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerEmail: e.target.value }))
              }
            />
            <Input
              label="ঠিকানা"
              value={form.customerAddress}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerAddress: e.target.value }))
              }
            />
          </div>
        </Card>
      )}

      {/* Items */}
      {!isFinalized && (
        <Card variant="glass" className="no-print p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">আইটেম</h2>
            <Button size="sm" variant="secondary" onClick={addItem}>
              <Plus className="h-3.5 w-3.5" />
              যোগ
            </Button>
          </div>

          <div className="space-y-3">
            {form.items.map((it, i) => (
              <div
                key={i}
                className="rounded-[12px] border border-line bg-surface/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {it.productId ? (
                      <p className="truncate text-sm font-semibold text-ink">
                        {it.productName}
                      </p>
                    ) : (
                      <p className="text-sm text-muted">প্রোডাক্ট নির্বাচন করুন</p>
                    )}
                    {it.productModel && (
                      <p className="truncate text-[11px] text-muted">
                        {it.productModel}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openProductPicker(i)}
                    className="rounded-[9px] border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-muted hover:text-ink"
                  >
                    {it.productId ? "পরিবর্তন" : "নির্বাচন"}
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Input
                    label="পরিমাণ"
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(i, { quantity: Number(e.target.value) || 0 })
                    }
                  />
                  <Input
                    label="ইউনিট দর"
                    type="number"
                    min="0"
                    value={it.unitPrice}
                    onChange={(e) =>
                      updateItem(i, { unitPrice: Number(e.target.value) || 0 })
                    }
                  />
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">
                      মোট
                    </label>
                    <div className="flex h-11 items-center rounded-[12px] border border-line bg-surface-2 px-3 text-sm font-semibold text-ink">
                      {formatTaka(it.total || 0)}
                    </div>
                  </div>
                </div>

                {form.items.length > 1 && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => removeItem(i)}
                      className="rounded-[9px] px-2 py-1 text-[11px] text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" /> মুছুন
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Totals + payment */}
      {!isFinalized && (
        <Card variant="glass" className="no-print p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            মোট ও পেমেন্ট
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="ডিসকাউন্ট (৳)"
              type="number"
              min="0"
              value={form.discountAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, discountAmount: Number(e.target.value) || 0 }))
              }
            />
            <Input
              label="ট্যাক্স (%)"
              type="number"
              min="0"
              max="100"
              value={form.taxPct}
              onChange={(e) =>
                setForm((f) => ({ ...f, taxPct: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="mt-4 rounded-[12px] border border-line bg-surface/50 p-4">
            <Row label="সাবটোটাল" value={formatTaka(totals.subtotal)} />
            {totals.discountAmount > 0 && (
              <Row
                label="ডিসকাউন্ট"
                value={`− ${formatTaka(totals.discountAmount)}`}
              />
            )}
            {totals.taxAmount > 0 && (
              <Row label="ট্যাক্স" value={formatTaka(totals.taxAmount)} />
            )}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-base font-semibold text-ink">
              <span>সর্বমোট</span>
              <span>{formatTaka(totals.grandTotal)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="পরিশোধিত (৳)"
              type="number"
              min="0"
              value={form.amountPaid}
              onChange={(e) =>
                setForm((f) => ({ ...f, amountPaid: Number(e.target.value) || 0 }))
              }
            />
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink">
                বাকি
              </label>
              <div className="flex h-11 items-center rounded-[12px] border border-line bg-surface-2 px-3 text-sm font-semibold text-ink">
                {formatTaka(due)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Input
              label="নোট"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </Card>
      )}

      {/* PDF PREVIEW — always rendered, hidden from screen if not needed */}
      <div className="flex justify-center">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[210mm] p-2">
            <InvoiceTemplate
              ref={pdfRef}
              invoice={invoiceForTemplate}
              branding={branding}
            />
          </div>
        </div>
      </div>

      {/* Product picker */}
      {showProductPicker && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProductPicker(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-strong relative my-8 w-full max-w-lg rounded-[20px] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">
                প্রোডাক্ট নির্বাচন
              </h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              placeholder="নাম বা মডেল…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <div className="mt-3 max-h-[50dvh] space-y-2 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p)}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-line bg-surface/50 p-2 text-left hover:border-line-strong hover:bg-surface-2/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{p.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {p.model || "—"} • স্টক {toBanglaNumber(p.currentStock || 0)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink">
                    {formatTaka(p.sellUnitPrice || 0)}
                  </span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">
                  কোনো প্রোডাক্ট পাওয়া যায়নি
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1 text-sm text-muted">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}