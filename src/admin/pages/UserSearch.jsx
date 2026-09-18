import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Users as UsersIcon } from "lucide-react";
import { listUsers } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, RoleBadge, StatusBadge } from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

const SEARCH_KEYS = [
  { k: "name",    l: "নাম" },
  { k: "email",   l: "ইমেইল" },
  { k: "phone",   l: "মোবাইল" },
  { k: "id",      l: "UID" },
  { k: "workspaceId", l: "ওয়ার্কস্পেস" },
];

export default function UserSearch() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [key, setKey] = useState("name");

  const run = async () => {
    setLoading(true);
    try {
      const list = await listUsers({ max: 800 });
      setRows(list);
      setLoaded(true);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (key === "id") return (u.id || "").toLowerCase().includes(term);
      if (key === "workspaceId") return (u.workspaceId || "").toLowerCase().includes(term);
      return String(u[key] || "").toLowerCase().includes(term);
    });
  }, [rows, q, key]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="ইউজার সার্চ"
        subtitle="যেকোনো ফিল্ড দিয়ে দ্রুত ইউজার খুঁজুন।"
      />

      <Card variant="glass" className="p-5">
        <div className="flex flex-wrap gap-2">
          {SEARCH_KEYS.map((s) => (
            <button
              key={s.k}
              onClick={() => setKey(s.k)}
              className={cn(
                "rounded-[10px] border px-3 py-1.5 text-xs transition-colors",
                key === s.k ? "border-accent-strong bg-accent/25 text-ink" : "border-line text-muted hover:border-line-strong"
              )}
            >
              {s.l}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="যা খুঁজছেন লিখুন…"
              value={q} onChange={(e) => setQ(e.target.value)}
              leftIcon={<SearchIcon className="h-4 w-4" />}
              onKeyDown={(e) => { if (e.key === "Enter" && !loaded) run(); }}
            />
          </div>
          <Button onClick={run} loading={loading}>
            <SearchIcon className="h-4 w-4" /> ডেটা লোড
          </Button>
        </div>

        {!loaded && !loading && (
          <p className="mt-3 text-xs text-subtle">
            প্রথমে "ডেটা লোড" চাপুন — তারপর সার্চ শুরু হবে।
          </p>
        )}
      </Card>

      {loaded && (
        <>
          {results.length === 0 ? (
            <EmptyState icon={UsersIcon} title="কোনো ফলাফল নেই" description="অন্য কিছু দিয়ে খুঁজুন।" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((u) => (
                <Card key={u.id} variant="glass" className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{u.name || "—"}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{u.email}</p>
                    </div>
                    <StatusBadge status={u.accountStatus} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted">
                    <RoleBadge role={u.role || "user"} />
                    <span>📱 {u.phone ? toBanglaNumber(u.phone) : "—"}</span>
                    <span>📦 {u.packageId || "free"}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-subtle">যোগদান: {toBanglaDate(u.createdAt)}</p>
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="mt-3 inline-block rounded-[10px] border border-line px-3 py-1.5 text-xs text-ink hover:bg-surface-2"
                  >
                    বিস্তারিত →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}