import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, Search, Tags, Edit3, Trash2, RefreshCw, Lock, X, Save,
} from "lucide-react";

import useCategories from "@/hooks/useCategories";
import useProducts from "@/hooks/useProducts";
import usePermission from "@/hooks/usePermission";
import useUsage from "@/hooks/useUsage";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import FeatureLimit from "@/components/package/FeatureLimit";
import UpgradePrompt from "@/components/package/UpgradePrompt";

export default function Categories() {
  const { can, canPage } = usePermission();
  const { categories, loading, reload, create, update, remove } = useCategories();
  const { products } = useProducts({ autoLoad: false });
  const { isExceeded } = useUsage("categories", "categoryLimit");

  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const pageAllowed = canPage("category");
  const canAdd = can("category", "add") && !isExceeded;
  const canEdit = can("category", "edit");
  const canDelete = can("category", "delete");

  const counts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (!p.categoryId) return;
      map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    });
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term)
    );
  }, [categories, q]);

  if (!pageAllowed) return <UpgradePrompt pageId="category" />;

  const openCreate = () => {
    setForm({ name: "", description: "" });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name || "", description: cat.description || "" });
    setEditing(cat);
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
        toast.success("ক্যাটাগরি যোগ হয়েছে");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`"${cat.name}" মুছবেন?`)) return;
    try {
      await remove(cat.id);
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
            ক্যাটাগরি
          </h1>
          <p className="mt-1 text-sm text-muted">
            মোট {toBanglaNumber(categories.length)}টি
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canAdd ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              ক্যাটাগরি যোগ
            </Button>
          ) : (
            <Button disabled>
              <Lock className="h-4 w-4" />
              {isExceeded ? "সীমা শেষ" : "অনুমতি নেই"}
            </Button>
          )}
        </div>
      </header>

      <Card variant="glass" className="p-4">
        <FeatureLimit
          usageKey="categories"
          limitKey="categoryLimit"
          label="ক্যাটাগরি সীমা"
        />
      </Card>

      <div className="max-w-md">
        <Input
          placeholder="নাম দিয়ে খুঁজুন…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">
          লোড হচ্ছে…
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={q ? "কিছু পাওয়া যায়নি" : "এখনো কোনো ক্যাটাগরি নেই"}
          description={
            q ? "অন্য কিছু দিয়ে খুঁজুন" : "নতুন ক্যাটাগরি যোগ করে শুরু করুন"
          }
          action={
            canAdd && !q ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> নতুন ক্যাটাগরি
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
            >
              <Card variant="glass" className="flex items-start gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent/25 text-accent-fg">
                  <Tags className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {c.name}
                  </p>
                  {c.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-subtle">
                    প্রোডাক্ট: {toBanglaNumber(counts[c.id] || 0)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-[9px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-[9px] p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)}>
            <h3 className="mb-4 text-base font-semibold text-ink">
              {editing ? `এডিট: ${editing.name}` : "নতুন ক্যাটাগরি"}
            </h3>
            <div className="space-y-3">
              <Input
                label="নাম"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  বিবরণ
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
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