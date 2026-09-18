import { useMemo } from "react";
import { Lock, AlertTriangle, Check } from "lucide-react";
import useUsage from "@/hooks/useUsage";
import { cn } from "@/utils/cn";

/**
 * Inline usage bar for a feature.
 *
 * Usage:
 *   <FeatureLimit usageKey="products" limitKey="productLimit" label="প্রোডাক্ট" />
 */
export default function FeatureLimit({
  usageKey,
  limitKey,
  label,
  showBar = true,
  className,
}) {
  const { used, limit, unlimited, enabled, percent, status, remaining } =
    useUsage(usageKey, limitKey);

  const labelText = useMemo(() => {
    if (!enabled) return "নিষ্ক্রিয়";
    if (unlimited) return "আনলিমিটেড";
    return `${used} / ${limit}`;
  }, [enabled, unlimited, used, limit]);

  if (!enabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] text-subtle",
          className
        )}
      >
        <Lock className="h-3 w-3" />
        {label || usageKey} — নিষ্ক্রিয়
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted">{label}</span>
          <span
            className={cn(
              "font-medium",
              status === "exceeded"
                ? "text-danger"
                : status === "warning"
                ? "text-warning"
                : "text-ink"
            )}
          >
            {labelText}
          </span>
        </div>
      )}

      {showBar && !unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              status === "exceeded"
                ? "bg-danger"
                : status === "warning"
                ? "bg-warning"
                : "bg-accent-strong"
            )}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      )}

      {!label && (
        <span
          className={cn(
            "text-[11px] font-medium",
            status === "exceeded"
              ? "text-danger"
              : status === "warning"
              ? "text-warning"
              : "text-ink"
          )}
        >
          {labelText}
        </span>
      )}

      {status === "exceeded" && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-danger">
          <AlertTriangle className="h-3 w-3" />
          সীমা শেষ হয়েছে — আপগ্রেড করুন
        </p>
      )}
    </div>
  );
}