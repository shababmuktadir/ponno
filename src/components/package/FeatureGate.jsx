import { Lock } from "lucide-react";
import usePermission from "@/hooks/usePermission";
import UpgradePrompt from "./UpgradePrompt";
import { cn } from "@/utils/cn";

/**
 * Wraps content and hides it if the user's package doesn't allow it.
 *
 * Usage:
 *   <FeatureGate page="product" feature="export">
 *     <ExportButton />
 *   </FeatureGate>
 *
 *   // or, full-page lock
 *   <FeatureGate page="sms" mode="page">
 *     <SmsPage />
 *   </FeatureGate>
 */
export default function FeatureGate({
  page,
  feature,
  mode = "feature", // "feature" | "page"
  children,
  fallback,
  silent = false,
}) {
  const { can, canPage } = usePermission();

  const allowed = mode === "page" ? canPage(page) : can(page, feature);

  if (allowed) return children;

  if (fallback) return fallback;

  if (silent) return null;

  // Default: inline locked chip
  if (mode === "feature") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface/60 px-3 py-1.5 text-xs text-muted">
        <Lock className="h-3.5 w-3.5" />
        আপগ্রেড প্রয়োজন
      </div>
    );
  }

  // Full page lock
  return <UpgradePrompt pageId={page} featureId={feature} />;
}