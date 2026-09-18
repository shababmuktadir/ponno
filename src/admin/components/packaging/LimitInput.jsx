import { Infinity as InfinityIcon } from "lucide-react";
import Input from "@/components/ui/Input";
import { cn } from "@/utils/cn";

/**
 * Numeric limit input with enable + unlimited toggles.
 *
 * value shape: { enabled: bool, value: number, unlimited: bool }
 *
 * Usage:
 *   <LimitInput
 *     label="সর্বোচ্চ প্রোডাক্ট"
 *     value={limit}
 *     onChange={(v) => ...}
 *     unit="টি"
 *   />
 */
export default function LimitInput({
  label,
  value = { enabled: false, value: 0, unlimited: false },
  onChange,
  unit = "",
  disabled = false,
}) {
  const setEnabled = (enabled) => {
    onChange?.({ ...value, enabled });
  };
  const setUnlimited = (unlimited) => {
    onChange?.({ ...value, unlimited });
  };
  const setValue = (v) => {
    onChange?.({ ...value, value: Math.max(0, Number(v) || 0) });
  };

  return (
    <div className="space-y-2 rounded-[12px] border border-line bg-surface/40 p-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            checked={!!value.enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 accent-[var(--accent-strong)]"
          />
          {label}
        </label>

        <button
          type="button"
          onClick={() => setUnlimited(!value.unlimited)}
          disabled={disabled || !value.enabled}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
            value.unlimited
              ? "border-accent-strong bg-accent/25 text-ink"
              : "border-line bg-surface-2 text-muted hover:border-line-strong",
            (!value.enabled || disabled) && "cursor-not-allowed opacity-50"
          )}
        >
          <InfinityIcon className="h-3 w-3" />
          আনলিমিটেড
        </button>
      </div>

      {/* Value row */}
      {value.enabled && !value.unlimited && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={value.value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-10 w-full rounded-[10px] border border-line bg-surface-solid px-3 text-sm text-ink",
              "focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/40",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          />
          {unit && (
            <span className="shrink-0 text-xs text-muted">{unit}</span>
          )}
        </div>
      )}

      {!value.enabled && (
        <p className="text-[11px] text-subtle">নিষ্ক্রিয় — এই সুবিধা নেই</p>
      )}
    </div>
  );
}