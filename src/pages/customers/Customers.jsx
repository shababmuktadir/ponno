import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, Search, Users as UsersIcon, Edit3, Trash2, RefreshCw,
  Lock, Save, Mail, MessageSquare, Check, X as XIcon, Send,
} from "lucide-react";

import useCustomers from "@/hooks/useCustomers";
import usePermission from "@/hooks/usePermission";
import useUsage from "@/hooks/useUsage";
import { sendBulkSMS } from "@/services/api/smsService";
import { sendBulkEmail } from "@/services/api/emailService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import FeatureLimit from "@/components/package/FeatureLimit";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

export default function Customers() {
  const { can, canPage } = usePermission();
  const { customers, loading, reload, create, update, remove } = useCustomers();
  const { isExceeded } = useUsage("customers", "customerLimit");

  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Bulk action state
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState("sms"); // "sms" | "email"
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const pageAllowed = canPage("customer");
  const canAdd = can("customer", "add") && !isExceeded;
  const canEdit = can("customer", "edit");
  const canDelete = can("customer", "delete");
  const canSMS = can("customer", "smsMarketing");
  const canEmail = can("customer", "emailMarketing");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(t) ||
        (c.phone || "").includes(t) ||
        (c.email || "").toLowerCase().includes(t)
    );
  }, [customers, q]);

  if (!pageAllowed) return <UpgradePrompt pageId="customer" />;

  const openCreate = () => {
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setEditing(c);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("নাম দিন");
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, form);
        toast.success("আপডেট হয়েছে");
      } else {
        await create(form);
        toast.success("কাস্টমার যোগ হয়েছে");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`"${c.name}" মুছবেন?`)) return;
    try {
      await remove(c.id);
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };

  const openBulk = (mode) => {
    if (selected.size === 0) return toast.error("কাস্টমার নির্বাচন করুন");
    setBulkMode(mode);
    setBulkSubject("");
    setBulkMessage("");
    setBulkOpen(true);
  };

  const sendBulk = async () => {
    if (!bulkMessage.trim()) return toast.error("বার্তা লিখুন");
    if (bulkMode === "email" && !bulkSubject.trim())
      return toast.error("বিষয় লিখুন");

    const chosen = filtered.filter((c) => selected.has(c.id));
    setSending(true);
    setProgress({ current: 0, total: chosen.length });

    try {
      if (bulkMode === "sms") {
        const phones = chosen
          .map((c) => c.phone)
          .filter((p) => p && p.trim());
        if (phones.length === 0)
          throw new Error("কোনো ফোন নাম্বার নেই");

        const res = await sendBulkSMS({
          phones,
          message: bulkMessage,
          onProgress: (i, total) =>
            setProgress({ current: i, total }),
        });

        toast.success(
          `SMS — সফল: ${toBanglaNumber(res.sent)}, ব্যর্থ: ${toBanglaNumber(
            res.failed
          )}`
        );
      } else {
        const emails = chosen
          .map((c) => c.email)
          .filter((e) => e && e.trim());
        if (emails.length === 0)
          throw new Error("কোনো ইমেইল নেই");

        const html = `
          <div style="font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif; font-size: 15px; line-height: 1.6; color: #111;">
            <p>${bulkMessage.replace(/\n/g, "<br/>")}</p>
          </div>
        `;

        const res = await sendBulkEmail({
          recipients: emails,
          subject: bulkSubject,
          html,
          text: bulkMessage,
          onProgress: (i, total) =>
            setProgress({ current: i, total }),
        });

        toast.success(
          `ইমেইল — সফল: ${toBanglaNumber(res.sent)}, ব্যর্থ: ${toBanglaNumber(
            res.failed
          )}`
        );
      }
      setBulkOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            কাস্টমার
          </h1>
          <p className="mt-1 text-sm text-muted">
            মোট {toBanglaNumber(customers.length)}জন
            {selected.size > 0 && ` • নির্বাচিত: ${toBanglaNumber(selected.size)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canAdd && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              কাস্টমার যোগ
            </Button>
          )}
        </div>
      </header>

      <Card variant="glass" className="p-4">
        <FeatureLimit
          usageKey="customers"
          limitKey="customerLimit"
          label="কাস্টমার সীমা"
        />
      </Card>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 rounded-[12px] border border-accent-strong/50 bg-accent/10 p-3"
        >
          <span className="text-xs font-medium text-ink">
            {toBanglaNumber(selected.size)} জন নির্বাচিত
          </span>
          {canSMS && (
            <Button size="sm" onClick={() => openBulk("sms")}>
              <MessageSquare className="h-3.5 w-3.5" />
              SMS পাঠান
            </Button>
          )}
          {canEmail && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openBulk("email")}
            >
              <Mail className="h-3.5 w-3.5" />
              ইমেইল পাঠান
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSelected(new Set())}
          >
            <XIcon className="h-3.5 w-3.5" />
            বাতিল
          </Button>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="নাম, ফোন বা ইমেইল…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <button
          onClick={selectAll}
          className="rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-xs text-muted hover:text-ink"
        >
          সব নির্বাচন / বাতিল
        </button>
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">
          লোড হচ্ছে…
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={q ? "কিছু পাওয়া যায়নি" : "এখনো কোনো কাস্টমার নেই"}
          description="নতুন কাস্টমার যোগ করে শুরু করুন"
          action={
            canAdd && !q ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> নতুন কাস্টমার
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card variant="glass" className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selected.size === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={selectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">নাম</th>
                    <th className="px-4 py-3 font-medium">ফোন</th>
                    <th className="px-4 py-3 font-medium">ইমেইল</th>
                    <th className="px-4 py-3 font-medium">ঠিকানা</th>
                    <th className="px-4 py-3 text-right font-medium">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-line/60 last:border-0 hover:bg-surface-2/40",
                        selected.has(c.id) && "bg-accent/10"
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3 text-ink">{c.name}</td>
                      <td className="px-4 py-3 text-muted">
                        {c.phone ? toBanglaNumber(c.phone) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-muted">
                        {c.address || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(c)}
                              className="rounded-[9px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="rounded-[9px] p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map((c) => (
              <Card key={c.id} variant="glass" className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.name}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      📞 {c.phone ? toBanglaNumber(c.phone) : "—"}
                    </p>
                    {c.email && (
                      <p className="truncate text-[11px] text-muted">
                        ✉ {c.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(c)}
                      className="flex-1 rounded-[10px] border border-line py-1.5 text-xs text-ink hover:bg-surface-2"
                    >
                      <Edit3 className="mr-1 inline h-3 w-3" /> এডিট
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(c)}
                      className="flex-1 rounded-[10px] border border-danger/40 py-1.5 text-xs text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" /> মুছুন
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)}>
            <h3 className="mb-4 text-base font-semibold text-ink">
              {editing ? `এডিট: ${editing.name}` : "নতুন কাস্টমার"}
            </h3>
            <div className="space-y-3">
              <Input
                label="নাম"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                label="ফোন"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
              <Input
                label="ইমেইল"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <Input
                label="ঠিকানা"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  নোট
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full rounded-[12px] border border-line bg-surface/70 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent-strong/70"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                বাতিল
              </Button>
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                {editing ? "আপডেট" : "তৈরি"}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Bulk modal */}
      <AnimatePresence>
        {bulkOpen && (
          <Modal onClose={() => setBulkOpen(false)}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
              {bulkMode === "sms" ? (
                <>
                  <MessageSquare className="h-4 w-4" />
                  বাল্ক SMS
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  বাল্ক ইমেইল
                </>
              )}
            </h3>

            <p className="mb-3 text-xs text-muted">
              প্রাপক: {toBanglaNumber(selected.size)} জন
            </p>

            {bulkMode === "email" && (
              <div className="mb-3">
                <Input
                  label="বিষয়"
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  placeholder="ইমেইলের বিষয়"
                />
              </div>
            )}

            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-medium text-ink">
                বার্তা
              </label>
              <textarea
                rows={5}
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder={
                  bulkMode === "sms"
                    ? "SMS বার্তা (১৬০ ক্যারেক্টার ideal)"
                    : "ইমেইলের বার্তা"
                }
                className="w-full rounded-[12px] border border-line bg-surface/70 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent-strong/70"
              />
              {bulkMode === "sms" && (
                <p className="mt-1 text-[10px] text-subtle">
                  অক্ষর: {toBanglaNumber(bulkMessage.length)}
                </p>
              )}
            </div>

            {sending && progress.total > 0 && (
              <div className="mb-3 rounded-[10px] border border-line bg-surface/50 p-3 text-xs">
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

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setBulkOpen(false)}
                disabled={sending}
              >
                বাতিল
              </Button>
              <Button onClick={sendBulk} loading={sending}>
                <Send className="h-4 w-4" />
                পাঠান
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
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