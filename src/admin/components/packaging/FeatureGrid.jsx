import { Check, X } from "lucide-react";
import { FEATURES } from "@/config/features";
import { cn } from "@/utils/cn";

/**
 * Grid of boolean feature toggles for a page.
 *
 * Usage:
 *   <FeatureGrid
 *     pageId="product"
 *     value={{ add: { enabled: true }, ... }}
 *     onChange={(featureId, enabled) => ...}
 *   />
 */
export default function FeatureGrid({ pageId, value = {}, onChange, columns = 2 }) {
  const list = FEATURES[pageId] || [];

  // Only boolean features here — limits handled separately
  const booleans = list.filter((f) => f.kind === "boolean");

  if (booleans.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${columns === 3 ? "180" : "220"}px, 1fr))`,
      }}
    >
      {booleans.map((f) => {
        const enabled = !!value[f.id]?.enabled;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange?.(f.id, !enabled)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-[11px] border px-3 py-2.5 text-left text-[13px] transition-all",
              enabled
                ? "border-accent-strong bg-accent/15 text-ink"
                : "border-line bg-surface/40 text-muted hover:border-line-strong hover:bg-surface-2/60"
            )}
          >
            <span className="truncate">{f.label}</span>
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                enabled
                  ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                  : "bg-surface-2 text-subtle"
              )}
            >
              {enabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}