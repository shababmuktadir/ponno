import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, Search, Package as PackageIcon, Edit3, Trash2,
  RefreshCw, Lock, X,
} from "lucide-react";

import useProducts from "@/hooks/useProducts";
import usePermission from "@/hooks/usePermission";
import useUsage from "@/hooks/useUsage";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import FeatureLimit from "@/components/package/FeatureLimit";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import ProductForm from "./ProductForm";

export default function Products() {
  const navigate = useNavigate();
  const { workspaceId } = useAuth();
  const { can, canPage } = usePermission();
  const { products, loading, reload, create, update, remove } = useProducts();
  const { isExceeded: limitExceeded } = useUsage("products", "productLimit");

  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const pageAllowed = canPage("product");
  const canAdd = can("product", "add") && !limitExceeded;
  const canEdit = can("product", "edit");
  const canDelete = can("product", "delete");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.model || "").toLowerCase().includes(term) ||
        (p.sku || "").toLowerCase().includes(term) ||
        (p.categoryNameSnapshot || "").toLowerCase().includes(term)
    );
  }, [products, q]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await update(editing.id, data);
        toast.success("আপডেট হয়েছে");
      } else {
        await create(data);
        toast.success("প্রোডাক্ট যোগ হয়েছে");
      }
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`"${p.name}" মুছবেন?`)) return;
    try {
      await remove(p.id);
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* ---------------- PAGE ACCESS CHECK ---------------- */
  if (!pageAllowed) {
    return <UpgradePrompt pageId="product" />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            প্রোডাক্ট
          </h1>
          <p className="mt-1 text-sm text-muted">
            মোট {toBanglaNumber(products.length)}টি
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canAdd ? (
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              প্রোডাক্ট যোগ
            </Button>
          ) : (
            <Button disabled title="সীমা শেষ বা অনুমতি নেই">
              <Lock className="h-4 w-4" />
              {limitExceeded ? "সীমা শেষ" : "অনুমতি নেই"}
            </Button>
          )}
        </div>
      </header>

      {/* Usage bar */}
      <Card variant="glass" className="p-4">
        <FeatureLimit
          usageKey="products"
          limitKey="productLimit"
          label="প্রোডাক্ট সীমা"
        />
      </Card>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="নাম, মডেল, SKU বা ক্যাটাগরি…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Content */}
      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">
          লোড হচ্ছে…
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title={
            q ? "কোনো প্রোডাক্ট পাওয়া যায়নি" : "এখনো কোনো প্রোডাক্ট নেই"
          }
          description={
            q ? "অন্য কিছু দিয়ে খুঁজুন" : "নতুন প্রোডাক্ট যোগ করে শুরু করুন"
          }
          action={
            canAdd && !q ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4" />
                প্রোডাক্ট যোগ করুন
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
                    <th className="px-4 py-3 font-medium">নাম</th>
                    <th className="px-4 py-3 font-medium">মডেল</th>
                    <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                    <th className="px-4 py-3 font-medium">ক্রয়</th>
                    <th className="px-4 py-3 font-medium">বিক্রয়</th>
                    <th className="px-4 py-3 font-medium">স্টক</th>
                    <th className="px-4 py-3 text-right font-medium">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.image?.thumbnailUrl || p.image?.secureUrl ? (
                            <img
                              src={p.image.thumbnailUrl || p.image.secureUrl}
                              alt={p.name}
                              className="h-8 w-8 shrink-0 rounded-[8px] object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-surface-2 text-subtle">
                              <PackageIcon className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <span className="truncate text-ink">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.model || "—"}</td>
                      <td className="px-4 py-3 text-muted">
                        {p.categoryNameSnapshot || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatTaka(p.buyUnitPrice || 0)}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {formatTaka(p.sellUnitPrice || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            p.currentStock > 0 ? "text-ink" : "text-danger"
                          }
                        >
                          {toBanglaNumber(p.currentStock || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditing(p);
                                setShowForm(true);
                              }}
                              className="rounded-[9px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(p)}
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
            {filtered.map((p) => (
              <Card key={p.id} variant="glass" className="p-4">
                <div className="flex items-start gap-3">
                  {p.image?.thumbnailUrl || p.image?.secureUrl ? (
                    <img
                      src={p.image.thumbnailUrl || p.image.secureUrl}
                      alt={p.name}
                      className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-subtle">
                      <PackageIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {p.name}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {p.model || "—"} • {p.categoryNameSnapshot || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                      <span className="text-muted">
                        ক্রয়: {formatTaka(p.buyUnitPrice || 0)}
                      </span>
                      <span className="text-ink">
                        বিক্রয়: {formatTaka(p.sellUnitPrice || 0)}
                      </span>
                      <span
                        className={
                          p.currentStock > 0 ? "text-ink" : "text-danger"
                        }
                      >
                        স্টক: {toBanglaNumber(p.currentStock || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                      className="flex-1 rounded-[10px] border border-line py-1.5 text-xs text-ink hover:bg-surface-2"
                    >
                      <Edit3 className="mr-1 inline h-3 w-3" /> এডিট
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(p)}
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

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <Modal
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
          >
            <h3 className="mb-4 text-base font-semibold text-ink">
              {editing ? `এডিট: ${editing.name}` : "নতুন প্রোডাক্ট"}
            </h3>
            <ProductForm
              workspaceId={workspaceId}
              initial={editing}
              onSave={handleSave}
              onClose={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Modal ---------------- */
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
        className="glass-strong relative my-8 w-full max-w-xl rounded-[20px] p-5"
      >
        {children}
      </motion.div>
    </div>
  );
}