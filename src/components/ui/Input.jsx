// src/components/ui/Input.jsx
import { forwardRef, useState } from "react";
import { cn } from "@/utils/cn";

const Input = forwardRef(function Input(
  { label, error, hint, className, id, required, leftIcon, rightSlot, ...rest },
  ref
) {
  const inputId = id || rest.name;
  const [focus, setFocus] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[13px] font-medium text-ink"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      <div
        className={cn(
          "group relative flex items-center rounded-[12px] border bg-surface/70 backdrop-blur-md",
          "transition-[border-color,box-shadow,background-color] duration-200",
          focus && "bg-surface",
          error
            ? "border-danger/70 focus-within:shadow-[0_0_0_4px_rgba(176,65,62,.12)]"
            : "border-line hover:border-line-strong focus-within:border-accent-strong/70 focus-within:shadow-[0_0_0_4px_rgba(201,185,148,.18)]"
        )}
      >
        {leftIcon && (
          <span className="pointer-events-none ml-3 flex h-4 w-4 shrink-0 items-center justify-center text-subtle group-focus-within:text-ink">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          ref={ref}
          onFocus={(e) => { setFocus(true);  rest.onFocus?.(e); }}
          onBlur={(e)  => { setFocus(false); rest.onBlur?.(e);  }}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full bg-transparent px-3.5 text-sm text-ink outline-none",
            "placeholder:text-subtle/90",
            leftIcon && "pl-2",
            rightSlot && "pr-2",
            className
          )}
          {...rest}
        />

        {rightSlot && <div className="mr-2 flex items-center">{rightSlot}</div>}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
});

export default Input;