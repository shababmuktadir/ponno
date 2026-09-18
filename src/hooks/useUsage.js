import { useMemo } from "react";
import usePackage from "./usePackage";
import {
  usagePercent, usageStatus, remainingQuota,
} from "@/services/firebase/usageService";

/**
 * Usage tracking helpers for a specific key.
 *
 * Usage:
 *   const { used, limit, percent, status, remaining, isExceeded, isWarning } =
 *     useUsage("products", "productLimit");
 */
export default function useUsage(usageKey, limitKey) {
  const { getUsageFor, getLimit } = usePackage();

  return useMemo(() => {
    const used = getUsageFor(usageKey);
    const rawLimit = getLimit(limitKey || usageKey);
    const limit = rawLimit?.unlimited ? "unlimited" : rawLimit?.value || 0;
    const enabled = !!rawLimit?.enabled;
    const unlimited = !!rawLimit?.unlimited;

    const pct = usagePercent(used, limit);
    const stat = usageStatus(used, limit);
    const rem = remainingQuota(used, limit);

    return {
      used,
      limit,
      enabled,
      unlimited,
      percent: pct,
      status: stat,
      remaining: rem,
      isWarning: stat === "warning",
      isExceeded: stat === "exceeded",
      canUse: enabled && (unlimited || rem > 0),
    };
  }, [usageKey, limitKey, getUsageFor, getLimit]);
}