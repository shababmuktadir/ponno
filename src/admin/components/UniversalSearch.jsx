import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Users, Package, CreditCard, Bell, ScrollText, ArrowRight,
  Loader2, X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getSearchIndex, searchAll } from "@/admin/services/adminSearch";
import { ROLE_LABELS } from "@/config/roles";

const KIND_META = {
  user:         { icon: Users,      label: "ইউজার",        color: "text-accent-strong" },
  package:      { icon: Package,    label: "প্যাকেজ",       color: "text-success" },
  subscription: { icon: CreditCard, label: "সাবস্ক্রিপশন",  color: "text-warning" },
  notification: { icon: Bell,       label: "নোটিফিকেশন",   color: "text-danger" },
  audit:        { icon: ScrollText, label: "অডিট লগ",       color: "text-muted" },
};

export default function UniversalSearch({ compact = false }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  // ---- Load index on first focus ----
  const ensureIndex = useCallback(async () => {
    setLoading(true);
    try {
      await getSearchIndex();
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Debounced search ----
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const idx = await getSearchIndex();
        setResults(searchAll(idx, q));
        setActive(0);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  // ---- Ctrl/Cmd + K ----
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        ensureIndex();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ensureIndex]);

  // ---- Click outside ----
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ---- Keyboard nav ----
  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) goTo(r);
    }
  };

  const goTo = (r) => {
    setOpen(false);
    setQ("");
    navigate(r.to);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Search input */}
      <div
        className={cn(
          "group flex items-center gap-2 rounded-[12px] border bg-surface/70 px-3 backdrop-blur-md transition-all",
          "border-line focus-within:border-accent-strong/70",
          "focus-within:shadow-[0_0_0_4px_rgba(201,185,148,.15)]",
          "dark:focus-within:shadow-[0_0_0_4px_rgba(217,207,190,.12)]",
          compact ? "h-10" : "h-11"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-subtle" />
        )}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { setOpen(true); ensureIndex(); }}
          onKeyDown={onKeyDown}
          placeholder="যেকোনো কিছু খুঁজুন… (নাম, ইমেইল, UID, প্যাকেজ, অ্যাকশন)"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-subtle/90"
        />
        {q ? (
          <button
            onClick={() => { setQ(""); inputRef.current?.focus(); }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-subtle hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted sm:block">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {open && (q.trim() || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[68dvh] overflow-hidden rounded-[18px] border border-glass-border"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="label-xs">
                {q.trim()
                  ? `ফলাফল: ${results.length}`
                  : loading
                  ? "ইনডেক্স লোড হচ্ছে…"
                  : "শুরু করতে টাইপ করুন"}
              </p>
              <span className="text-[10px] text-subtle">
                ↑↓ navigate • ↵ open • Esc close
              </span>
            </div>

            {/* Results */}
            <div className="max-h-[calc(68dvh-42px)] overflow-y-auto p-2">
              {loading && !results.length ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-[12px] bg-surface-2"
                    />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted">
                  কোনো ফলাফল পাওয়া যায়নি।
                </div>
              ) : (
                results.map((r, i) => {
                  const meta = KIND_META[r.kind] || KIND_META.user;
                  const Icon = meta.icon;
                  const isActive = i === active;
                  return (
                    <button
                      key={`${r.kind}-${r.id}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goTo(r)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-surface-2 ring-1 ring-accent-strong/40 dark:ring-accent/30"
                          : "hover:bg-surface-2/70"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface-2",
                          meta.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-ink">
                            {r.title}
                          </p>
                          {r.badge && (
                            <span className="shrink-0 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                              {ROLE_LABELS[r.badge] || r.badge}
                            </span>
                          )}
                        </div>
                        {r.subtitle && (
                          <p className="truncate text-xs text-muted">
                            {r.subtitle}
                          </p>
                        )}
                        {r.meta && (
                          <p className="mt-0.5 truncate text-[10px] text-subtle">
                            {r.meta}
                          </p>
                        )}
                      </div>

                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-all",
                          isActive
                            ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                            : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}