import { useMemo, useState } from "react";
import {
  MessagesSquare, Search, AlertCircle, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useAdminChat from "@/admin/hooks/useAdminChat";
import { deleteConversation } from "@/services/firebase/chatService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaDateTime } from "@/utils/banglaDate";
import { toBanglaNumber } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import ChatWindow from "@/components/chat/ChatWindow";
import { cn } from "@/utils/cn";

export default function AdminChat() {
  const {
    conversations,
    loading,
    activeId,
    setActiveId,
    active,
    messages,
    sending,
    send,
    totalUnread,
  } = useAdminChat();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return conversations.filter((c) => {
      const matchQ =
        !t ||
        (c.userName || "").toLowerCase().includes(t) ||
        (c.userEmail || "").toLowerCase().includes(t) ||
        (c.lastMessage || "").toLowerCase().includes(t);
      const matchF =
        filter === "all" ||
        (filter === "unread" && (c.unreadForStaff || 0) > 0);
      return matchQ && matchF;
    });
  }, [conversations, q, filter]);

  const handleDelete = async (conv) => {
    if (!confirm(`"${conv.userName || "ইউজার"}" এর চ্যাট ডিলিট করবেন?`)) return;
    try {
      await deleteConversation(conv.id);
      toast.success("চ্যাট ডিলিট হয়েছে");
      if (activeId === conv.id) setActiveId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            সাপোর্ট চ্যাট
          </h1>
          <p className="mt-1 text-sm text-muted">
            ব্যবহারকারীদের সাথে রিয়েল-টাইম কথোপকথন
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                <AlertCircle className="h-2.5 w-2.5" />
                {toBanglaNumber(totalUnread)}টি অপঠিত
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <Card
          variant="glass"
          className={cn(
            "overflow-hidden p-0",
            activeId ? "hidden lg:block" : "block"
          )}
        >
          <div className="border-b border-line p-3">
            <Input
              placeholder="নাম বা ইমেইল…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <div className="mt-2 flex gap-1 rounded-[10px] border border-line bg-surface/50 p-1">
              {[
                { v: "all", l: "সব" },
                { v: "unread", l: "অপঠিত" },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFilter(f.v)}
                  className={cn(
                    "flex-1 rounded-[7px] px-2 py-1 text-[11px] font-medium transition-colors",
                    filter === f.v
                      ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[70dvh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted">
                লোড হচ্ছে…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                কোনো চ্যাট নেই
              </div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group relative flex w-full items-start gap-3 border-b border-line/60 p-3 transition-colors last:border-0 hover:bg-surface-2/50",
                    activeId === c.id && "bg-surface-2"
                  )}
                >
                  <button
                    onClick={() => setActiveId(c.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/25 text-sm font-bold text-accent-fg">
                      {(c.userName || "?").charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1 pr-8">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {c.userName || "ইউজার"}
                        </p>
                        {c.lastAt && (
                          <span className="shrink-0 text-[10px] text-subtle">
                            {toBanglaDateTime(c.lastAt).split(",")[1] || ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {c.lastMessage || "নতুন কথোপকথন"}
                      </p>
                    </div>

                    {(c.unreadForStaff || 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                        {toBanglaNumber(c.unreadForStaff)}
                      </span>
                    )}
                  </button>

                  {/* Delete button — appears on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c);
                    }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger/10 text-danger opacity-0 transition-opacity hover:bg-danger/20 group-hover:opacity-100"
                    aria-label="চ্যাট ডিলিট"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chat area */}
        <Card
          variant="glass"
          className={cn(
            "overflow-hidden p-0",
            !activeId ? "hidden lg:block" : "block"
          )}
        >
          <div className="h-[70dvh] min-h-[420px]">
            {active ? (
              <ChatWindow
                conversation={active}
                messages={messages}
                onSend={send}
                onBack={() => setActiveId(null)}
                sending={sending}
                headerSubtitle={`${active.userEmail || ""}${
                  active.workspaceId
                    ? ` • ${active.workspaceId.slice(0, 8)}…`
                    : ""
                }`}
                className="h-full rounded-none border-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={MessagesSquare}
                  title="কোনো চ্যাট নির্বাচন করুন"
                  description="বাম দিক থেকে একটি কথোপকথন বেছে নিন"
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}