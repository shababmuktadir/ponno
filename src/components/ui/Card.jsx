// src/components/ui/Card.jsx
import { cn } from "@/utils/cn";

export default function Card({
  className,
  variant = "solid", // "solid" | "glass" | "glass-strong"
  hover = false,
  children,
  ...rest
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] p-4 sm:p-5",
        variant === "solid"        && "card",
        variant === "glass"        && "glass",
        variant === "glass-strong" && "glass-strong",
        hover &&
          "transition-transform duration-300 ease-out hover:-translate-y-0.5 " +
          "hover:shadow-[var(--shadow-lg)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}