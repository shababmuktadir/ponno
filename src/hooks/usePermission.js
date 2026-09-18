import { useCallback } from "react";
import usePackage from "./usePackage";

/**
 * Feature / page access helpers.
 *
 * Usage:
 *   const { can, canPage, getLimit, canCreate } = usePermission();
 *   if (!canPage("product")) return <NoAccess />;
 *   if (can("product", "export")) { ... }
 */
export default function usePermission() {
  const {
    isPageAccessible,
    hasFeature,
    getLimit,
    canCreateMore,
  } = usePackage();

  const canPage = useCallback(
    (pageId) => isPageAccessible(pageId),
    [isPageAccessible]
  );

  const can = useCallback(
    (pageId, featureId) => hasFeature(pageId, featureId),
    [hasFeature]
  );

  const canCreate = useCallback(
    (usageKey, limitKey) => canCreateMore(usageKey, limitKey),
    [canCreateMore]
  );

  return { canPage, can, getLimit, canCreate };
}