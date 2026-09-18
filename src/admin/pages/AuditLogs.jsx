import { useEffect, useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { listAuditLogs } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";
import { toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader } from "@/admin/components/AdminUI";

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await listAuditLogs(500);
        setRows(list);
      } catch (err) { toast.error(getErrorMessage(err)); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        (r.action || "").toLowerCase().includes(term) ||
        (r.actorName || "").toLowerCase().includes(term) ||
        (r.actorId || "").toLowerCase().includes(term)
    );
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="অডিট লগ"
        subtitle="সব প্রশাসনিক কার্যক্রমের রেকর্ড।"
      />

      <div className="sm:max-w-md">
        <Input
          placeholder="অ্যাকশন বা অ্যাক্টর…"
          value={q} onChange={(e) => setQ(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="কোনো লগ নেই" description="প্রশাসনিক কাজ করলে এখানে রেকর্ড হবে।" />
      ) : (
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">সময়</th>
                  <th className="px-4 py-3 font-medium">অ্যাক্টর</th>
                  <th className="px-4 py-3 font-medium">অ্যাকশন</th>
                  <th className="px-4 py-3 font-medium">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{toBanglaDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3 text-ink">
                      {l.actorName || "—"}
                      <span className="ml-1 text-[10px] text-subtle">({l.actorRole})</span>
                    </td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">{l.action}</td>
                    <td className="px-4 py-3 text-xs text-subtle">
                      <pre className="max-w-xs overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(l.meta || {}, null, 0)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}