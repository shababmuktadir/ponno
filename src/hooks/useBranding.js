import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useWorkspace } from "@/hooks/useWorkspace";

/**
 * Returns the current user's branding info.
 * Works in dark/light, prints in light always.
 */
export function useBranding() {
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { workspace } = useWorkspace();

  return useMemo(() => {
    const wsLogo = workspace?.logo;
    const uploadedLogo =
      (typeof wsLogo === "string" ? wsLogo : null) ||
      wsLogo?.secureUrl ||
      wsLogo?.url ||
      null;

    const defaultLight = "/logo.png";
    const defaultDark = "/logo-dark.png";

    const logoUrl = uploadedLogo || (isDark ? defaultDark : defaultLight);
    const logoForPrint = uploadedLogo || defaultLight;

    const businessName =
      workspace?.businessName || profile?.name || "আমার ব্যবসা";

    const dashboardName =
      workspace?.dashboardName || workspace?.businessName || businessName;

    return {
      businessName,
      dashboardName,
      logoUrl,
      logoForPrint,
      hasCustomLogo: Boolean(uploadedLogo),

      phone: workspace?.phone || profile?.phone || "",
      email: workspace?.email || profile?.email || "",
      address: workspace?.address || "",
      website: workspace?.website || "",
      currency: workspace?.currency || "BDT",

      workspaceId: workspace?.id || null,
      workspace,
    };
  }, [workspace, profile, isDark]);
}

// Default export for compatibility with `import useBranding from "..."`
export default useBranding;