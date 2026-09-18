import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Search } from "lucide-react";
import { listUsage, listUsers, listPackages } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, TableEmpty } from "@/admin/components/AdminUI";

export default function Usage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [u, p, us] = await Promise.all([listUsers(), listPackages(), listUsage()]);
        setUsers(u);
        setPackages(p);
        setRows(us);
      } catch (err) { toast.error(getErrorMessage(err)); }
      finally { setLoading(false); }
    })();
  }, []);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const pkgMap = Object.fromEntries(packages.map((p) => [p.id, p]));

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const u = userMap[r.userId] || userMap[r.workspaceId];
    const term = q.toLowerCase();
    return (
      (u?.name || "").toLowerCase().includes(term) ||
      (u?.email || "").toLowerCase().includes(term) ||
      (r.id || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="ইউজার ইউসেজ ট্র্যাকিং"
        subtitle="প্রতিটি ওয়ার্কস্পেসের ব্যবহার।"
      />

      <div className="sm:max-w-md">
        <Input
          placeholder="ইউজার বা ওয়ার্কস্পেস আইডি…"
          value={q} onChange={(e) => setQ(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Activity} title="কোনো ইউসেজ ডেটা নেই" description="ইউজার ডেটা যোগ করলে এখানে দেখা যাবে।" />
      ) : (
        <Card variant="glass" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">ওয়ার্কস্পেস</th>
                  <th className="px-4 py-3 font-medium">ইউজার</th>
                  <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                  <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                  <th className="px-4 py-3 font-medium">সদস্য</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <TableEmpty colSpan={5} />
                ) : filtered.map((r) => {
                  const u = userMap[r.userId] || userMap[r.workspaceId];
                  const pkg = pkgMap[u?.packageId] || pkgMap["free"];
                  return (
                    <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                      <td className="px-4 py-3 text-xs text-muted"><code>{r.id}</code></td>
                      <td className="px-4 py-3 text-ink">{u?.name || "—"}</td>
                      <td className="px-4 py-3 text-muted">
                        {toBanglaNumber(r.productsUsed || 0)}
                        {pkg?.limits?.products ? ` / ${toBanglaNumber(pkg.limits.products)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {toBanglaNumber(r.categoriesUsed || 0)}
                        {pkg?.limits?.categories ? ` / ${toBanglaNumber(pkg.limits.categories)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {toBanglaNumber(r.membersUsed || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}