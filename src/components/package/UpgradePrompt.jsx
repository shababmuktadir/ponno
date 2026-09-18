import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Sparkles, ArrowRight, Check } from "lucide-react";
import usePackage from "@/hooks/usePackage";
import Button from "@/components/ui/Button";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { cn } from "@/utils/cn";

/**
 * Full-page lock screen shown when a user's package
 * doesn't include a feature/page.
 *
 * Usage:
 *   <UpgradePrompt pageId="sms" />
 */
export default function UpgradePrompt({
  pageId,
  featureId,
  title,
  message,
  className,
}) {
  const { pkg, isStaff } = usePackage();

  const displayTitle = title || "এই ফিচারটি আপনার প্যাকেজে নেই";
  const displayMessage =
    message ||
    "এই ফিচার ব্যবহার করতে আপনার প্যাকেজ আপগ্রেড করুন। অ্যাডমিনের সাথে যোগাযোগ করুন।";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[20px] border border-line bg-surface/60 p-8 text-center backdrop-blur-md",
        className
      )}
    >
      <div className="relative">
        <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-accent-strong to-accent text-accent-fg shadow-[var(--shadow-md)]">
          <Lock className="h-6 w-6" />
        </span>
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
          !
        </span>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">{displayTitle}</h2>
        <p className="mt-2 text-sm text-muted">{displayMessage}</p>
      </div>

      <div className="w-full rounded-[14px] border border-line bg-surface-2/60 p-4 text-left">
        <p className="text-[11px] uppercase tracking-wider text-muted">
          আপনার বর্তমান প্যাকেজ
        </p>
        <p className="mt-1 flex items-center gap-2 text-base font-semibold text-ink">
          <Sparkles className="h-4 w-4 text-accent-strong" />
          {pkg?.name || "ফ্রি"}
          {pkg?.monthlyPrice > 0 && (
            <span className="text-xs font-normal text-muted">
              ৳{toBanglaNumber(pkg.monthlyPrice)}/মাস
            </span>
          )}
        </p>
      </div>

      <div className="flex w-full flex-wrap gap-2">
        <Button
          as={Link}
          to="/pricing"
          className="flex-1"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          প্যাকেজ দেখুন
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {isStaff && (
        <p className="text-[11px] text-subtle">
          আপনি স্টাফ হিসেবে লগইন করেছেন — সব ফিচার আপনার জন্য খোলা।
        </p>
      )}
    </motion.div>
  );
}