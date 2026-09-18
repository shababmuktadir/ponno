import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import {
  doc, getDoc, onSnapshot,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { calcAllPrices } from "@/config/pricing";
import { getPricingSettings } from "@/services/firebase/pricingService";
import { getUsage } from "@/services/firebase/usageService";

const PackageContext = createContext(null);

const DEFAULT_FREE_PKG = {
  id: "free",
  name: "ফ্রি",
  badge: "ফ্রি",
  description: "ডিফল্ট ফ্রি প্যাকেজ",
  icon: "Sparkles",
  color: "#9CA3AF",
  monthlyPrice: 0,
  yearlyDiscount: 0,
  fiveYearDiscount: 0,
  active: true,
  order: 0,
  limits: {},
  pages: {},
};

const PACKAGE_REFRESH_MS = 2 * 60 * 1000; // 2 minutes
const PRICING_REFRESH_MS = 10 * 60 * 1000; // 10 minutes

export function PackageProvider({ children }) {
  const auth = useAuth() || {};
  const { firebaseUser, profile, workspaceId } = auth;

  const [pkg, setPkg] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const usageUnsub = useRef(null);
  const pkgTimer = useRef(null);
  const pricingTimer = useRef(null);

  /* -------- 1) Pricing — fetch once + refresh every 10 min -------- */
  useEffect(() => {
    let cancel = false;

    const fetchPricing = async () => {
      try {
        const p = await getPricingSettings();
        if (!cancel) setPricing(p);
      } catch (err) {
        if (import.meta.env.DEV) console.error("[pricing]", err);
      }
    };

    fetchPricing();
    pricingTimer.current = setInterval(fetchPricing, PRICING_REFRESH_MS);

    return () => {
      cancel = true;
      if (pricingTimer.current) clearInterval(pricingTimer.current);
    };
  }, []);

  /* -------- 2) Package — fetch once + refresh every 2 min -------- */
  useEffect(() => {
    if (pkgTimer.current) {
      clearInterval(pkgTimer.current);
      pkgTimer.current = null;
    }

    if (!firebaseUser || !profile) {
      setPkg(null);
      setLoading(false);
      return;
    }

    const packageId = profile.packageId || "free";

    if (packageId === "free" || packageId === "staff") {
      setPkg({ ...DEFAULT_FREE_PKG, id: packageId });
      setLoading(false);
      return;
    }

    let cancel = false;

    const fetchPkg = async () => {
      try {
        const snap = await getDoc(doc(db, "packages", packageId));
        if (cancel) return;
        if (snap.exists()) {
          setPkg({ id: snap.id, ...snap.data() });
        } else {
          setPkg({ ...DEFAULT_FREE_PKG });
        }
        setError(null);
      } catch (err) {
        if (cancel) return;
        if (import.meta.env.DEV) console.error("[package fetch]", err);
        setError(err.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    setLoading(true);
    fetchPkg();
    pkgTimer.current = setInterval(fetchPkg, PACKAGE_REFRESH_MS);

    return () => {
      cancel = true;
      if (pkgTimer.current) clearInterval(pkgTimer.current);
    };
  }, [firebaseUser, profile?.packageId]);

  /* -------- 3) Usage — realtime (small doc, one listener) -------- */
  useEffect(() => {
    if (usageUnsub.current) {
      usageUnsub.current();
      usageUnsub.current = null;
    }

    if (!workspaceId) {
      setUsage(null);
      return;
    }

    const ref = doc(db, "usage", workspaceId);

    // Try realtime first; fallback to polling if it fails
    let pollingTimer = null;
    const startPolling = () => {
      if (pollingTimer) return;
      const fetchNow = async () => {
        try {
          const u = await getUsage(workspaceId);
          setUsage(u || null);
        } catch {
          /* ignore */
        }
      };
      fetchNow();
      pollingTimer = setInterval(fetchNow, 60 * 1000);
    };

    try {
      const unsub = onSnapshot(
        ref,
        (snap) => {
          setUsage(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        },
        (err) => {
          if (import.meta.env.DEV)
            console.error("[usage realtime]", err?.message);
          // Fallback to polling
          if (usageUnsub.current) {
            usageUnsub.current();
            usageUnsub.current = null;
          }
          startPolling();
        }
      );
      usageUnsub.current = unsub;
    } catch (err) {
      if (import.meta.env.DEV) console.error("[usage setup]", err);
      startPolling();
    }

    return () => {
      if (usageUnsub.current) {
        usageUnsub.current();
        usageUnsub.current = null;
      }
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [workspaceId]);

  /* -------- Derived prices -------- */
  const prices = useMemo(() => {
    if (!pkg) return null;
    return calcAllPrices(pkg, pricing || {});
  }, [pkg, pricing]);

  /* -------- Helpers -------- */
  const isPageAccessible = useCallback(
    (pageId) => {
      if (!pkg) return false;
      const role = profile?.role || "user";
      const staff =
        role === "superAdmin" ||
        role === "admin" ||
        role === "moderator" ||
        role === "editor" ||
        role === "support";
      if (staff) return true;

      return !!pkg.pages?.[pageId]?.access;
    },
    [pkg, profile]
  );

  const getFeature = useCallback(
    (pageId, featureId) => {
      const page = pkg?.pages?.[pageId];
      const f = page?.features?.[featureId];
      return f || { enabled: false };
    },
    [pkg]
  );

  const hasFeature = useCallback(
    (pageId, featureId) => {
      if (!pkg) return false;
      const role = profile?.role || "user";
      const staff =
        role === "superAdmin" ||
        role === "admin" ||
        role === "moderator" ||
        role === "editor" ||
        role === "support";
      if (staff) return true;
      return !!getFeature(pageId, featureId).enabled;
    },
    [pkg, profile, getFeature]
  );

  const getLimit = useCallback(
    (featureId) => {
      const direct = pkg?.limits?.[featureId];
      if (direct) {
        if (!direct.enabled)
          return { enabled: false, value: 0, unlimited: false };
        if (direct.unlimited)
          return {
            enabled: true,
            value: "unlimited",
            unlimited: true,
            period: direct.period,
          };
        return {
          enabled: true,
          value: Number(direct.value) || 0,
          unlimited: false,
          period: direct.period,
        };
      }

      if (pkg?.pages) {
        for (const page of Object.values(pkg.pages)) {
          const f = page?.features?.[featureId];
          if (f && ("unlimited" in f || "value" in f)) {
            if (!f.enabled)
              return { enabled: false, value: 0, unlimited: false };
            if (f.unlimited)
              return { enabled: true, value: "unlimited", unlimited: true };
            return { enabled: true, value: Number(f.value) || 0, unlimited: false };
          }
        }
      }

      return { enabled: false, value: 0, unlimited: false };
    },
    [pkg]
  );

  const getUsageFor = useCallback(
    (key) => (usage ? Number(usage[key]) || 0 : 0),
    [usage]
  );

  const canCreateMore = useCallback(
    (key, limitKey) => {
      const lim = getLimit(limitKey || key);
      if (!lim.enabled) return false;
      if (lim.unlimited) return true;
      return getUsageFor(key) < lim.value;
    },
    [getLimit, getUsageFor]
  );

  const value = useMemo(
    () => ({
      pkg,
      pricing,
      usage,
      prices,
      loading,
      error,

      packageId: pkg?.id || profile?.packageId || "free",
      packageName: pkg?.name || "ফ্রি",
      isFree: (pkg?.id || "free") === "free",
      isStaff: [
        "superAdmin",
        "admin",
        "moderator",
        "editor",
        "support",
      ].includes(profile?.role),

      isPageAccessible,
      getFeature,
      hasFeature,
      getLimit,
      getUsageFor,
      canCreateMore,
    }),
    [
      pkg,
      pricing,
      usage,
      prices,
      loading,
      error,
      profile,
      isPageAccessible,
      getFeature,
      hasFeature,
      getLimit,
      getUsageFor,
      canCreateMore,
    ]
  );

  return (
    <PackageContext.Provider value={value}>
      {children}
    </PackageContext.Provider>
  );
}

export function usePackageContext() {
  const ctx = useContext(PackageContext);
  if (!ctx) {
    throw new Error(
      "usePackageContext must be used inside <PackageProvider>. " +
        "Check src/App.jsx"
    );
  }
  return ctx;
}