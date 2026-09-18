import { useState } from "react";
import { Download, Check, Smartphone, Share, Plus } from "lucide-react";
import toast from "react-hot-toast";
import usePWAInstall from "@/hooks/usePWAInstall";
import Button from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export default function InstallButton({
  variant = "primary",
  size = "md",
  full = false,
  label = "অ্যাপ ইনস্টল করুন",
  className,
}) {
  const { canInstall, installed, promptInstall, isIOS } = usePWAInstall();
  const [loading, setLoading] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (installed) {
    return (
      <Button
        variant="secondary"
        size={size}
        disabled
        className={cn(full && "w-full", className)}
      >
        <Check className="h-4 w-4 text-success" />
        ইনস্টল করা হয়েছে
      </Button>
    );
  }

  const handleClick = async () => {
    if (canInstall) {
      setLoading(true);
      const { outcome } = await promptInstall();
      setLoading(false);
      if (outcome === "accepted") {
        toast.success("অ্যাপ ইনস্টল হয়েছে!");
      } else if (outcome === "dismissed") {
        toast.error("ইনস্টল বাতিল করা হয়েছে।");
      }
      return;
    }

    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    toast(
      "ব্রাউজার মেনু (⋮) → 'Install app' বা 'Add to Home screen' চাপুন",
      { icon: "📲", duration: 5000 }
    );
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        loading={loading}
        className={cn(full && "w-full", className)}
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>

      {showIOSHelp && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSHelp(false)}
          />
          <div className="glass-strong relative w-full max-w-sm rounded-[20px] p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent/25 text-accent-fg">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-ink">
              iOS-এ ইনস্টল করুন
            </h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
                  ১
                </span>
                <p>
                  Safari-র নিচে{" "}
                  <Share className="mx-1 inline h-4 w-4 text-ink" />{" "}
                  <b className="text-ink">Share</b> বাটনে ক্লিক করুন
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
                  ২
                </span>
                <p>
                  স্ক্রোল করে{" "}
                  <Plus className="mx-1 inline h-4 w-4 text-ink" />{" "}
                  <b className="text-ink">Add to Home Screen</b> চাপুন
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
                  ৩
                </span>
                <p>
                  নাম দিন ও <b className="text-ink">Add</b> চাপুন
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowIOSHelp(false)}
              className="mt-5 w-full"
            >
              বুঝেছি
            </Button>
          </div>
        </div>
      )}
    </>
  );
}