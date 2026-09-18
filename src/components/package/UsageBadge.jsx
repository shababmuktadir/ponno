import { cn } from "@/utils/cn";
import useUsage from "@/hooks/useUsage";

/**
 * Compact usage badge for sidebar / header.
 *
 * Usage:
 *   <UsageBadge usageKey="products" limitKey="productLimit" label="প্রোডাক্ট" />
 */
export default function UsageBadge({
  usageKey,
  limitKey,
  label,
  compact = false,
  className,
}) {
  const { used, limit, unlimited, enabled, status } = useUsage(usageKey, limitKey);

  if (!enabled) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums",
        status === "exceeded"
          ? "border-danger/40 bg-danger/10 text-danger"
          : status === "warning"
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-line bg-surface-2 text-muted",
        className
      )}
      title={label ? `${label}: ${used} / ${unlimited ? "∞" : limit}` : undefined}
    >
      {!compact && label && <span>{label}</span>}
      <span>{unlimited ? "∞" : `${used}/${limit}`}</span>
    </span>
  );
}