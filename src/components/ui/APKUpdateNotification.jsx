import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import useAPKUpdate from "@/hooks/useAPKUpdate";

export default function APKUpdateNotification() {
  const { isNative, updateAvailable, latest, currentVersion } = useAPKUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!isNative || !updateAvailable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="no-print fixed bottom-[88px] left-3 right-3 z-[60] lg:bottom-4 lg:left-auto lg:right-4 lg:w-[400px]"
      >
        <div className="glass-strong relative overflow-hidden rounded-[18px] p-4">
          <button
            onClick={() => setDismissed(true)}
            aria-label="পরে"
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-success/15 text-success">
              <Package className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                নতুন অ্যাপ আপডেট
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Version <b className="text-ink">{latest?.version}</b> এখন
                উপলব্ধ (বর্তমান: {currentVersion})। নতুন APK ডাউনলোড করে
                ইনস্টল করুন।
              </p>

              {latest?.body && (
                <p className="mt-1.5 line-clamp-2 text-[10px] text-subtle">
                  {latest.body}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                {latest?.apkUrl ? (
                  <Button size="sm" as="a" href={latest.apkUrl} download>
                    <Download className="h-3.5 w-3.5" />
                    ডাউনলোড করুন
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    as="a"
                    href={latest?.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    রিলিজ দেখুন
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDismissed(true)}
                >
                  পরে
                </Button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-success/20 blur-2xl" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}