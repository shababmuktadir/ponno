import { usePackageContext } from "@/context/PackageContext";

/**
 * Returns the current user's package data + helpers.
 * Usage:
 *   const { pkg, prices, isPageAccessible, hasFeature, getLimit } = usePackage();
 */
export default function usePackage() {
  return usePackageContext();
}