import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import usePWAInstall from "@/hooks/usePWAInstall";
import InstallButton from "./InstallButton";

const KEY = "pm.pwa.dismissedAt";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function InstallBanner() {
  const { canInstall, installed, isIOS } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const last = Number(localStorage.getItem(KEY) || 0);
    setDismissed(Date.now() - last < SEVEN_DAYS);
  }, []);

  const visible =
    mounted && !installed && !dismissed && (canInstall || isIOS);

  const dismiss = () => {
    localStorage.setItem(KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="no-print fixed bottom-[88px] left-3 right-3 z-40 lg:bottom-4 lg:left-auto lg:right-4 lg:w-[380px]"
        >
          <div className="glass-strong relative overflow-hidden rounded-[18px] p-4">
            <button
              onClick={dismiss}
              aria-label="বন্ধ"
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
                  অ্যাপ হিসেবে ইনস্টল করুন
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  হোম স্ক্রিন থেকে সরাসরি চালান — দ্রুত, offline-ready,
                  fullscreen।
                </p>
                <div className="mt-3">
                  <InstallButton size="sm" label="ইনস্টল" />
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/30 blur-2xl dark:bg-accent/15" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}