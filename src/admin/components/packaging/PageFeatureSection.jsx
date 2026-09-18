import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { FEATURES, PAGES } from "@/config/features";
import FeatureGrid from "./FeatureGrid";
import LimitInput from "./LimitInput";
import { cn } from "@/utils/cn";

/**
 * One section per page — access toggle + feature grid + limits.
 *
 * Usage:
 *   <PageFeatureSection
 *     pageId="product"
 *     pageData={pkg.pages.product}
 *     onChange={(newPageData) => ...}
 *   />
 */
export default function PageFeatureSection({ pageId, pageData, onChange }) {
  const [open, setOpen] = useState(false);

  const pageMeta = PAGES.find((p) => p.id === pageId);
  const allFeatures = FEATURES[pageId] || [];
  const limitFeatures = allFeatures.filter((f) => f.kind === "limit");

  const access = !!pageData?.access;
  const features = pageData?.features || {};

  const updateAccess = (val) => {
    onChange?.({ ...pageData, access: val });
  };

  const updateFeature = (featureId, enabled) => {
    onChange?.({
      ...pageData,
      features: {
        ...features,
        [featureId]: { ...(features[featureId] || {}), enabled },
      },
    });
  };

  const updateLimit = (featureId, newVal) => {
    onChange?.({
      ...pageData,
      features: {
        ...features,
        [featureId]: {
          enabled: newVal.enabled,
          value: newVal.value,
          unlimited: newVal.unlimited,
        },
      },
    });
  };

  const enabledCount = Object.values(features).filter(
    (f) => f?.enabled
  ).length;

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface/40">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2/50"
      >
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-ink truncate">
            {pageMeta?.label || pageId}
          </span>
          <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
            {enabledCount}টি ফিচার
          </span>

          {!access && (
            <span className="inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] text-danger">
              <Lock className="h-2.5 w-2.5" />
              বন্ধ
            </span>
          )}
        </div>

        <label
          className="flex shrink-0 cursor-pointer items-center gap-2 text-[11px] text-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={access}
            onChange={(e) => updateAccess(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent-strong)]"
          />
          পেজ access
        </label>

        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn("border-t border-line", !access && "opacity-60")}
          >
            <div className="space-y-4 p-4">
              {/* Feature toggles */}
              {allFeatures.filter((f) => f.kind === "boolean").length > 0 && (
                <div>
                  <p className="label-xs mb-2">ফিচার সমূহ</p>
                  <FeatureGrid
                    pageId={pageId}
                    value={features}
                    onChange={updateFeature}
                  />
                </div>
              )}

              {/* Limit inputs */}
              {limitFeatures.length > 0 && (
                <div>
                  <p className="label-xs mb-2">সীমা</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {limitFeatures.map((f) => (
                      <LimitInput
                        key={f.id}
                        label={f.label}
                        unit={f.unit}
                        value={features[f.id] || { enabled: false, value: 0, unlimited: false }}
                        onChange={(v) => updateLimit(f.id, v)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}