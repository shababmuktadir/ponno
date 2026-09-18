import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import useFCM from "@/hooks/useFCM";
import { cn } from "@/utils/cn";

export default function FCMEnableButton({
  variant = "primary",
  size = "md",
  full = false,
  className,
}) {
  const { supported, permission, enabled, registering, enable, disable } =
    useFCM();

  if (!supported) {
    return (
      <div className="rounded-[12px] border border-line bg-surface/50 p-3 text-xs text-muted">
        এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই। Chrome ব্যবহার করুন।
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-[12px] border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        নোটিফিকেশন ব্লক করা আছে। Address bar এর 🔒 icon → Notifications → Allow করুন।
      </div>
    );
  }

  if (enabled && permission === "granted") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
          <BellRing className="h-3.5 w-3.5" />
          নোটিফিকেশন চালু
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={disable}
          className={cn(full && "w-full")}
        >
          <BellOff className="h-3.5 w-3.5" />
          বন্ধ করুন
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      loading={registering}
      onClick={enable}
      disabled={registering}
      className={cn(full && "w-full", className)}
    >
      {registering ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          চালু হচ্ছে…
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          নোটিফিকেশন চালু করুন
        </>
      )}
    </Button>
  );
}