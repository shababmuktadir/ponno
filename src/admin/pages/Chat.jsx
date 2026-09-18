import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { listSupportChats } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader } from "@/admin/components/AdminUI";

export default function Chat() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await listSupportChats();
        setRows(list);
      } catch (err) {
        // Collection may not exist yet — that's fine
        if (import.meta.env.DEV) console.log("[chat]", err?.message);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="সাপোর্ট চ্যাট"
        subtitle="ইউজারদের সাথে রিয়েল-টাইম কথোপকথন।"
      />

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="এখনো কোনো চ্যাট নেই"
          description="ইউজার সাপোর্ট চ্যাট শুরু করলে এখানে দেখা যাবে।"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card variant="glass" className="overflow-hidden p-0">
            <div className="max-h-[70dvh] overflow-y-auto">
              {rows.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c)}
                  className={`w-full border-b border-line/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2/50 ${
                    active?.id === c.id ? "bg-surface-2" : ""
                  }`}
                >
                  <p className="truncate text-sm font-medium text-ink">{c.userName || c.id}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{c.lastMessage || "—"}</p>
                  <p className="mt-1 text-[10px] text-subtle">{toBanglaDateTime(c.lastAt)}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="flex h-[70dvh] flex-col p-0">
            {active ? (
              <>
                <div className="border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{active.userName || active.id}</p>
                  <p className="text-xs text-muted">{active.userId || ""}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs text-subtle">
                    রিয়েল-টাইম মেসেজ লোডিং পরবর্তী ধাপে যোগ হবে — Firestore collection
                    <code className="ml-1 text-ink">supportChats/{active.id}/messages</code>।
                  </p>
                </div>
                <div className="border-t border-line p-3">
                  <input
                    disabled
                    placeholder="পরবর্তী ধাপে সক্রিয় হবে…"
                    className="h-11 w-full rounded-[12px] border border-line bg-surface/60 px-3 text-sm text-muted outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted">
                বাম দিক থেকে একটি চ্যাট নির্বাচন করুন।
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}