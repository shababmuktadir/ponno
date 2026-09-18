import { useEffect, useState } from "react";
import { GITHUB_RELEASES_API, APP_VERSION } from "@/config/version";

const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

function compareVersions(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export default function useAPKUpdate() {
  const [isNative, setIsNative] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latest, setLatest] = useState(null);

  // Detect if running inside Capacitor (APK)
  useEffect(() => {
    const native =
      typeof window !== "undefined" &&
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform();
    setIsNative(Boolean(native));
  }, []);

  useEffect(() => {
    if (!isNative) return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(GITHUB_RELEASES_API, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) return;
        const data = await res.json();

        const latestVersion = String(data.tag_name || "").replace(/^v/, "");
        if (!latestVersion) return;

        if (compareVersions(latestVersion, APP_VERSION) > 0) {
          const apkAsset =
            data.assets?.find((a) => a.name.endsWith(".apk")) || null;

          if (!cancelled) {
            setUpdateAvailable(true);
            setLatest({
              version: latestVersion,
              name: data.name || `v${latestVersion}`,
              body: data.body || "",
              publishedAt: data.published_at,
              apkUrl: apkAsset?.browser_download_url || null,
              htmlUrl: data.html_url,
            });
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("[APK update check]", err);
      }
    };

    check();
    const t = setInterval(check, CHECK_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [isNative]);

  return {
    isNative,
    updateAvailable,
    latest,
    currentVersion: APP_VERSION,
  };
}