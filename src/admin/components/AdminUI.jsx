import { cn } from "@/utils/cn";
import { toBanglaNumber } from "@/utils/banglaNumber";

const ROLE_LABELS = {
  superAdmin: "সুপার অ্যাডমিন",
  admin: "অ্যাডমিন",
  moderator: "মডারেটর",
  editor: "এডিটর",
  support: "সাপোর্ট",
  user: "ইউজার",
};

export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function StatCard({ label, value, icon: Icon, tone, money }) {
  const t = tone || "ink";
  const m = money || false;

  const toneClass =
    t === "warning"
      ? "bg-warning/15 text-warning"
      : t === "success"
      ? "bg-success/15 text-success"
      : t === "danger"
      ? "bg-danger/15 text-danger"
      : t === "accent"
      ? "bg-accent/30 text-accent-fg"
      : "bg-ink text-bg dark:bg-accent dark:text-accent-fg";

  const display =
    value === undefined || value === null
      ? "…"
      : m
      ? "৳ " + toBanglaNumber(Number(value).toLocaleString("en-IN"))
      : toBanglaNumber(value);

  return (
    <div className="glass rounded-[16px] p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[11px]",
          toneClass
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-ink">{display}</p>
    </div>
  );
}

export function RoleBadge({ role }) {
  const r = role || "user";
  const cls =
    r === "superAdmin"
      ? "border-accent-strong bg-accent/25 text-accent-fg"
      : r === "admin"
      ? "border-danger/40 bg-danger/10 text-danger"
      : r === "moderator"
      ? "border-warning/40 bg-warning/10 text-warning"
      : r === "editor"
      ? "border-success/40 bg-success/10 text-success"
      : "border-line bg-surface-2 text-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        cls
      )}
    >
      {ROLE_LABELS[r] || r}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = status || "expired";
  const cls =
    s === "active"
      ? "border-success/40 bg-success/10 text-success"
      : s === "pending"
      ? "border-warning/40 bg-warning/10 text-warning"
      : s === "suspended"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-line-strong bg-surface-2 text-muted";

  const label =
    s === "active"
      ? "সক্রিয়"
      : s === "pending"
      ? "পেন্ডিং"
      : s === "suspended"
      ? "নিষ্ক্রিয়"
      : s === "expired"
      ? "মেয়াদোত্তীর্ণ"
      : s === "cancelled"
      ? "বাতিল"
      : s;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        cls
      )}
    >
      {label}
    </span>
  );
}

export function TableEmpty({ colSpan, message }) {
  return (
    <tr>
      <td
        colSpan={colSpan || 1}
        className="px-4 py-10 text-center text-sm text-muted"
      >
        {message || "কোনো তথ্য পাওয়া যায়নি।"}
      </td>
    </tr>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  danger,
  loading,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="glass-strong relative w-full max-w-sm rounded-[18px] p-5">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-[10px] border border-line px-3.5 py-2 text-sm text-ink hover:bg-surface-2"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-[10px] px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50",
              danger ? "bg-danger" : "bg-ink dark:bg-accent dark:text-accent-fg"
            )}
          >
            {loading ? "…" : "নিশ্চিত"}
          </button>
        </div>
      </div>
    </div>
  );
}