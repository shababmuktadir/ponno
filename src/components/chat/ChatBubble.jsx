import { Check, CheckCheck } from "lucide-react";
import { toBanglaDateTime } from "@/utils/banglaDate";
import { cn } from "@/utils/cn";

export default function ChatBubble({ message, isMine, showTime = true }) {
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isMine ? "justify-end" : "justify-start"
      )}
    >
      {!isMine && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-surface-2 text-[10px] font-bold text-muted">
          {(message.senderName || "?").charAt(0).toUpperCase()}
        </span>
      )}

      <div
        className={cn(
          "max-w-[78%] rounded-[16px] px-3.5 py-2 shadow-[var(--shadow-xs)]",
          isMine
            ? "rounded-tr-[6px] bg-ink text-bg dark:bg-accent dark:text-accent-fg"
            : "rounded-tl-[6px] border border-line bg-surface-solid text-ink"
        )}
      >
        {!isMine && message.senderName && (
          <p
            className={cn(
              "mb-0.5 text-[10px] font-semibold opacity-70"
            )}
          >
            {message.senderName}
          </p>
        )}

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.text}
        </p>

        {showTime && (
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              isMine ? "opacity-60" : "text-subtle"
            )}
          >
            <span>{toBanglaDateTime(message.createdAt)}</span>
            {isMine && <CheckCheck className="h-3 w-3" />}
          </div>
        )}
      </div>
    </div>
  );
}