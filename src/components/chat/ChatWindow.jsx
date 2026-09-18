import { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatBubble from "./ChatBubble";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";

export default function ChatWindow({
  conversation,
  messages,
  onSend,
  onBack,
  sending,
  headerSubtitle,
  className,
}) {
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    try {
      await onSend(t);
      setText("");
      inputRef.current?.focus();
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[16px] border border-line bg-bg-elevated",
        className
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface/70 px-4 py-3 backdrop-blur-md">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface-2 lg:hidden"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {conversation?.userName || conversation?.title || "চ্যাট"}
          </p>
          <p className="truncate text-[11px] text-muted">
            {headerSubtitle || "সাপোর্ট"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-ink">
                এখনো কোনো বার্তা নেই
              </p>
              <p className="mt-1 text-xs text-muted">
                প্রথম বার্তা পাঠান
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ChatBubble
                message={m}
                isMine={m.senderId === profile?.uid}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-line bg-surface/70 p-3 backdrop-blur-md"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // auto-grow up to ~5 lines
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="বার্তা লিখুন…"
            className={cn(
              "max-h-36 min-h-[42px] w-full resize-none rounded-[12px] border border-line bg-surface-solid px-3.5 py-2.5 text-sm text-ink",
              "placeholder:text-subtle focus:border-accent-strong focus:outline-none"
            )}
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className={cn(
              "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-all",
              text.trim() && !sending
                ? "bg-ink text-bg hover:opacity-90 dark:bg-accent dark:text-accent-fg"
                : "bg-surface-2 text-subtle cursor-not-allowed"
            )}
            aria-label="পাঠান"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}