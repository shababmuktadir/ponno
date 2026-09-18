import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  UserCog, Plus, Search, Trash2, Edit3, Save, X, Shield,
  Mail, Phone, Check, Lock,
} from "lucide-react";

import useTeam from "@/hooks/useTeam";
import usePermission from "@/hooks/usePermission";
import useUsage from "@/hooks/useUsage";
import {
  PERMISSION_KEYS, defaultPermissions,
} from "@/services/firebase/teamService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import FeatureLimit from "@/components/package/FeatureLimit";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const ROLES = [
  { id: "helper", label: "হেল্পার" },
  { id: "manager", label: "ম্যানেজার" },
  { id: "accountant", label: "অ্যাকাউন্ট্যান্ট" },
];

export default function Team() {
  const { canPage, can } = usePermission();
  const { members, loading, add, update, remove } = useTeam();
  const { isExceeded } = useUsage("users", "userLimit");

  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    uid: "",
    name: "",
    email: "",
    phone: "",
    role: "helper",
    permissions: defaultPermissions(),
  });

  const pageAllowed = canPage("user");
  const canAdd = can("user", "staffInvite") && !isExceeded;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return members;
    return members.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(t) ||
        (m.email || "").toLowerCase().includes(t) ||
        (m.phone || "").includes(t)
    );
  }, [members, q]);

  if (!pageAllowed) return <UpgradePrompt pageId="user" />;

  const openCreate = () => {
    setForm({
      uid: "",
      name: "",
      email: "",
      phone: "",
      role: "helper",
      permissions: defaultPermissions(),
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setForm({
      uid: m.uid,
      name: m.name || "",
      email: m.email || "",
      phone: m.phone || "",
      role: m.role || "helper",
      permissions: m.permissions || defaultPermissions(),
    });
    setEditing(m);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.uid.trim()) return toast.error("Firebase UID দিন");
    if (!form.email.trim()) return toast.error("ইমেইল দিন");
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, {
          name: form.name,
          phone: form.phone,
          role: form.role,
          permissions: form.permissions,
        });
        toast.success("আপডেট হয়েছে");
      } else {
        await add(form);
        toast.success("সদস্য যোগ হয়েছে");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (!confirm(`"${m.name}" কে টিম থেকে সরাবেন?`)) return;
    try {
      await remove(m.id);
      toast.success("সরানো হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const togglePermission = (key) => {
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [key]: !f.permissions[key],
      },
    }));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            ইউজার / টিম
          </h1>
          <p className="mt-1 text-sm text-muted">
            মোট {toBanglaNumber(members.length)} জন সদস্য
          </p>
        </div>
        {canAdd && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            নতুন সদস্য
          </Button>
        )}
      </header>

      <Card variant="glass" className="p-4">
        <FeatureLimit
          usageKey="users"
          limitKey="userLimit"
          label="ইউজার সীমা"
        />
      </Card>

      <div className="max-w-md">
        <Input
          placeholder="নাম, ইমেইল বা ফোন…"
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
          icon={UserCog}
          title={q ? "কিছু পাওয়া যায়নি" : "এখনো কোনো সদস্য নেই"}
          description="আপনার টিমে নতুন সদস্য যোগ করে শুরু করুন"
          action={
            canAdd && !q ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                সদস্য যোগ করুন
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
            >
              <Card variant="glass" className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/25 text-sm font-bold text-accent-fg">
                    {(m.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {m.name || "—"}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {ROLES.find((r) => r.id === m.role)?.label || m.role}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
                      m.status === "active"
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-line bg-surface-2 text-muted"
                    )}
                  >
                    {m.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-muted">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {m.email || "—"}
                  </p>
                  {m.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {toBanglaNumber(m.phone)}
                    </p>
                  )}
                  <p>যোগদান: {toBanglaDate(m.addedAt)}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 rounded-[10px] border border-line py-1.5 text-xs text-ink hover:bg-surface-2"
                  >
                    <Edit3 className="mr-1 inline h-3 w-3" /> এডিট
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="flex-1 rounded-[10px] border border-danger/40 py-1.5 text-xs text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="mr-1 inline h-3 w-3" /> মুছুন
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="glass-strong relative my-8 w-full max-w-lg rounded-[20px] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink">
                  {editing ? `এডিট: ${editing.name}` : "নতুন সদস্য"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-surface-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {!editing && (
                  <>
                    <Input
                      label="Firebase UID"
                      value={form.uid}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, uid: e.target.value }))
                      }
                      placeholder="ব্যবহারকারী আগে সাইনআপ করলে UID পাবেন"
                      required
                    />
                    <Input
                      label="ইমেইল"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </>
                )}

                <Input
                  label="নাম"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />

                <Input
                  label="ফোন"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-ink">
                    রোল
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, role: r.id }))
                        }
                        className={cn(
                          "rounded-[10px] border px-3 py-1.5 text-xs transition-colors",
                          form.role === r.id
                            ? "border-accent-strong bg-accent/20 text-ink"
                            : "border-line bg-surface-2 text-muted"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[13px] font-medium text-ink">
                    পারমিশন
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSION_KEYS.map((p) => {
                      const enabled = !!form.permissions[p.id];
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePermission(p.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[11px] transition-colors",
                            enabled
                              ? "border-accent-strong bg-accent/15 text-ink"
                              : "border-line bg-surface/40 text-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded",
                              enabled
                                ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                                : "bg-surface-2"
                            )}
                          >
                            {enabled && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  বাতিল
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4" />
                  {editing ? "আপডেট" : "যোগ করুন"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}