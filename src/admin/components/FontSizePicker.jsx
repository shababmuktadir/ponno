import { motion } from "framer-motion";
import { Minus, Plus, RotateCcw, Type } from "lucide-react";
import { useFontSize } from "@/context/FontSizeContext";
import { cn } from "@/utils/cn";

export default function FontSizePicker({ compact = false }) {
  const {
    sizeId, current, sizes, setSize, increase, decrease, reset,
    canIncrease, canDecrease,
  } = useFontSize();

  return (
    <div className="space-y-4">
      {/* Header with +/- buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-ink">
            <Type className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">ফন্ট সাইজ</p>
            <p className="text-[11px] text-muted">
              বর্তমান: <b className="text-ink">{current.label}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-[11px] border border-line bg-surface/60 p-1 backdrop-blur-md">
          <button
            onClick={decrease}
            disabled={!canDecrease}
            aria-label="ছোট করুন"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors",
              canDecrease
                ? "text-ink hover:bg-surface-2"
                : "cursor-not-allowed text-subtle opacity-50"
            )}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[52px] text-center text-xs font-medium text-ink">
            {current.px}px
          </span>
          <button
            onClick={increase}
            disabled={!canIncrease}
            aria-label="বড় করুন"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors",
              canIncrease
                ? "text-ink hover:bg-surface-2"
                : "cursor-not-allowed text-subtle opacity-50"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Size chips */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {sizes.map((s) => {
          const active = s.id === sizeId;
          return (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-[12px] border px-3 py-3 transition-all",
                active
                  ? "border-accent-strong bg-accent/20 dark:bg-accent/15"
                  : "border-line bg-surface/50 hover:border-line-strong hover:bg-surface-2/60"
              )}
            >
              {active && (
                <motion.span
                  layoutId="fontSizeActive"
                  className="pointer-events-none absolute inset-0 rounded-[12px] ring-1 ring-accent-strong/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className="text-ink"
                style={{ fontSize: `${s.px}px`, lineHeight: 1 }}
              >
                {s.sample}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  active ? "font-medium text-ink" : "text-muted"
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      {!compact && (
        <div className="rounded-[12px] border border-line bg-surface/50 p-4 backdrop-blur-md">
          <p className="label-xs mb-2">প্রিভিউ</p>
          <p
            className="text-ink"
            style={{ fontSize: `${current.px}px`, lineHeight: 1.6 }}
          >
            এইভাবে টেক্সট দেখাবে — প্রোডাক্ট ম্যানেজমেন্ট সিস্টেম।
          </p>
          <p
            className="mt-1 text-muted"
            style={{ fontSize: `${current.px * 0.85}px`, lineHeight: 1.6 }}
          >
            ছোট টেক্সট: ইনভেন্টরি, স্টক, বিক্রয় ও রিপোর্ট।
          </p>
        </div>
      )}

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={reset}
          disabled={sizeId === "md"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs transition-colors",
            sizeId === "md"
              ? "cursor-not-allowed border-line text-subtle opacity-50"
              : "border-line text-muted hover:border-line-strong hover:text-ink"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          ডিফল্টে রিসেট
        </button>
      </div>
    </div>
  );
}