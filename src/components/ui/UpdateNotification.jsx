import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, X, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import useAppUpdate from "@/hooks/useAppUpdate";
import { APP_VERSION, BUILD_ID } from "@/config/version";

export default function UpdateNotification() {
  const { needRefresh, offlineReady, updating, applyUpdate, dismiss } =
    useAppUpdate();

  return (
    <>
      {/* ---------- Update Available ---------- */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="no-print fixed left-1/2 top-3 z-[70] w-[calc(100%-24px)] max-w-md -translate-x-1/2"
          >
            <div className="glass-strong relative overflow-hidden rounded-[18px] p-4">
              <button
                onClick={dismiss}
                aria-label="পরে"
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-accent-strong to-accent text-accent-fg shadow-[0_4px_16px_-2px_rgba(201,185,148,.5)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    নতুন আপডেট পাওয়া গেছে
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    Version {APP_VERSION} ({BUILD_ID}) রিলিজ হয়েছে।
                    এখনই আপডেট করে নতুন ফিচার উপভোগ করুন।
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={applyUpdate} loading={updating}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      এখনই আপডেট
                    </Button>
                    <Button size="sm" variant="secondary" onClick={dismiss}>
                      পরে
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/30 blur-2xl dark:bg-accent/15" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Offline Ready ---------- */}
      <AnimatePresence>
        {offlineReady && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="no-print fixed left-1/2 top-3 z-[65] -translate-x-1/2"
          >
            <div className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-xs text-ink">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              অ্যাপ এখন offline-এও কাজ করবে
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}