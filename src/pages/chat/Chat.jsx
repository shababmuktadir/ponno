import { Link } from "react-router-dom";
import {
  MessagesSquare, RefreshCw, Bell, Info, ShieldCheck,
} from "lucide-react";
import useChat from "@/hooks/useChat";
import usePermission from "@/hooks/usePermission";
import useFCM from "@/hooks/useFCM";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ChatWindow from "@/components/chat/ChatWindow";
import FCMEnableButton from "@/components/notifications/FCMEnableButton";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { toBanglaNumber } from "@/utils/banglaNumber";

export default function Chat() {
  const { canPage } = usePermission();
  const { conversation, messages, loading, sending, send } = useChat();
  const { enabled, supported, permission } = useFCM();

  const pageAllowed = canPage("chat");

  if (!pageAllowed) return <UpgradePrompt pageId="chat" />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            চ্যাট
          </h1>
          <p className="mt-1 text-sm text-muted">
            সাপোর্ট টিমের সাথে সরাসরি কথা বলুন
          </p>
        </div>
      </header>

      {/* FCM banner */}
      {supported && permission !== "denied" && !enabled && (
        <Card variant="glass" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent/25 text-accent-fg">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">
                  নতুন বার্তার নোটিফিকেশন চালু করুন
                </p>
                <p className="text-[11px] text-muted">
                  অ্যাপ বন্ধ থাকলেও বার্তা পাবেন
                </p>
              </div>
            </div>
            <FCMEnableButton size="sm" />
          </div>
        </Card>
      )}

      {/* Chat container */}
      <Card variant="glass" className="p-0">
        <div className="h-[calc(100dvh-280px)] min-h-[420px]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              চ্যাট লোড হচ্ছে…
            </div>
          ) : !conversation ? (
            <EmptyState
              icon={MessagesSquare}
              title="চ্যাট প্রস্তুত হয়নি"
              description="একটু পর আবার চেষ্টা করুন"
            />
          ) : (
            <ChatWindow
              conversation={conversation}
              messages={messages}
              onSend={send}
              sending={sending}
              headerSubtitle={`সাপোর্ট • ${toBanglaNumber(messages.length)} বার্তা`}
              className="h-full rounded-none border-0"
            />
          )}
        </div>
      </Card>

      {/* Info footer */}
      <Card variant="glass" className="p-4">
        <div className="flex items-start gap-2 text-[11px] text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            আপনার সব বার্তা এনক্রিপ্টেড এবং শুধু আপনি ও সাপোর্ট টিম দেখতে পারবে।
            কেউ আপনার চ্যাট দেখতে পারবে না।
          </p>
        </div>
      </Card>
    </div>
  );
}