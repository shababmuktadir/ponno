import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Check, CheckCheck, Search, AlertCircle, Info,
  AlertTriangle, Sparkles,
} from "lucide-react";
import useUserNotifications from "@/hooks/useUserNotifications";
import usePermission from "@/hooks/usePermission";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const PRIORITY_ICON = {
  high: AlertTriangle,
  normal: Info,
  low: Info,
};

const PRIORITY_STYLE = {
  high: "border-danger/40 bg-danger/10 text-danger",
  normal: "border-accent-strong/50 bg-accent/15 text-accent-fg",
  low: "border-line bg-surface-2 text-muted",
};

const PRIORITY_LABEL = {
  high: "উচ্চ",
  normal: "সাধারণ",
  low: "নিম্ন",
};

export default function Notifications() {
  const { canPage } = usePermission();
  const { notifications, unreadCount, loading, markRead, markAll } =
    useUserNotifications();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const pageAllowed = canPage("notification");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchQ =
        !t ||
        (n.title || "").toLowerCase().includes(t) ||
        (n.message || "").toLowerCase().includes(t);
      const matchF =
        filter === "all" ||
        (filter === "unread" && !n.isRead) ||
        (filter === "read" && n.isRead);
      return matchQ && matchF;
    });
  }, [notifications, q, filter]);

  if (!pageAllowed) return <UpgradePrompt pageId="notification" />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            নোটিফিকেশন
          </h1>
          <p className="mt-1 text-sm text-muted">
            {unreadCount > 0
              ? `${toBanglaNumber(unreadCount)}টি অপঠিত`
              : "সব পড়া হয়েছে"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAll}>
            <CheckCheck className="h-4 w-4" />
            সব পড়া চিহ্নিত করুন
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="খুঁজুন…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-1 rounded-[12px] border border-line bg-surface/60 p-1 backdrop-blur-md">
          {[
            { v: "all", l: "সব" },
            { v: "unread", l: "অপঠিত" },
            { v: "read", l: "পঠিত" },
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
          icon={Bell}
          title={q ? "কিছু পাওয়া যায়নি" : "কোনো নোটিফিকেশন নেই"}
          description="Admin নোটিফিকেশন পাঠালে এখানে দেখাবে"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const Icon = PRIORITY_ICON[n.priority] || Info;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
              >
                <Card
                  variant="glass"
                  className={cn(
                    "cursor-pointer p-4 transition-all",
                    !n.isRead && "border-accent-strong/40 bg-accent/5"
                  )}
                  onClick={() => !n.isRead && markRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border",
                        PRIORITY_STYLE[n.priority] || PRIORITY_STYLE.normal
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            n.isRead ? "text-muted" : "text-ink"
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-accent-strong" />
                        )}
                        <span
                          className={cn(
                            "rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                            PRIORITY_STYLE[n.priority] || PRIORITY_STYLE.normal
                          )}
                        >
                          {PRIORITY_LABEL[n.priority] || "সাধারণ"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted">{n.message}</p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-subtle">
                        <span>{toBanglaDateTime(n.createdAt)}</span>
                        {n.isRead && (
                          <span className="flex items-center gap-1 text-success">
                            <Check className="h-3 w-3" /> পড়া হয়েছে
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}