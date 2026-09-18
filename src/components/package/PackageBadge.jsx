import { Sparkles, Crown } from "lucide-react";
import usePackage from "@/hooks/usePackage";
import { cn } from "@/utils/cn";

/**
 * Small badge showing the current package name.
 * Good for sidebar footer or profile dropdown.
 */
export default function PackageBadge({ compact = false, className }) {
  const { pkg, isFree, prices } = usePackage();

  if (!pkg) return null;

  const color = pkg.color || "#C9B994";
  const isPro = !isFree;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        className
      )}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}22`,
        color: "var(--text)",
      }}
    >
      {isPro ? (
        <Crown className="h-3 w-3" style={{ color }} />
      ) : (
        <Sparkles className="h-3 w-3" style={{ color }} />
      )}
      {compact ? pkg.badge || pkg.name : `প্যাকেজ: ${pkg.name}`}
      {isPro && prices?.monthly?.final > 0 && !compact && (
        <span className="text-[10px] text-muted">
          ৳{prices.monthly.final}/মাস
        </span>
      )}
    </span>
  );
}