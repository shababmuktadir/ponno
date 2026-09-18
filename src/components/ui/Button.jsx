// src/components/ui/Button.jsx
import { cn } from "@/utils/cn";

const VARIANTS = {
  primary:
    "bg-ink text-bg border border-transparent hover:opacity-95 " +
    "dark:bg-accent dark:text-accent-fg dark:hover:opacity-95 " +
    "shadow-[0_6px_18px_-4px_rgba(11,11,12,.35)] " +
    "dark:shadow-[0_6px_22px_-4px_rgba(217,207,190,.25)]",

  glass:
    "glass text-ink hover:brightness-[1.03] active:brightness-[0.98]",

  secondary:
    "bg-surface-2 text-ink border border-line hover:border-line-strong backdrop-blur-md",

  outline:
    "border border-line-strong bg-transparent text-ink hover:bg-surface-2",

  ghost:
    "bg-transparent text-ink hover:bg-surface-2",

  danger:
    "bg-danger text-white hover:opacity-95 shadow-[0_6px_18px_-4px_rgba(176,65,62,.4)]",
};

const SIZES = {
  sm:   "h-9  px-3.5 text-[13px] rounded-[10px] gap-1.5",
  md:   "h-11 px-5   text-sm     rounded-[12px] gap-2",
  lg:   "h-12 px-6   text-[15px] rounded-[13px] gap-2",
  icon: "h-10 w-10  rounded-[11px]",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      disabled={Tag === "button" ? disabled || loading : undefined}
      className={cn(
        "relative inline-flex select-none items-center justify-center font-medium",
        "transition-[transform,opacity,box-shadow,background-color] duration-200 ease-out",
        "active:scale-[.985] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong",
        "whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Tag>
  );
}