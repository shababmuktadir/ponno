import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Download, Printer } from "lucide-react";
import { listUsers, listSubscriptions, listPackages } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { AdminPageHeader, TableEmpty } from "@/admin/components/AdminUI";
import * as XLSX from "xlsx";

const REPORTS = [
  { id: "users",         title: "ইউজার রিপোর্ট" },
  { id: "subscriptions", title: "সাবস্ক্রিপশন রিপোর্ট" },
  { id: "revenue",       title: "রেভিনিউ রিপোর্ট" },
];

export default function Reports() {
  const [active, setActive] = useState("users");
  const [data, setData] = useState({ users: [], subscriptions: [], packages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, s, p] = await Promise.all([listUsers(), listSubscriptions(), listPackages()]);
        setData({ users: u, subscriptions: s, packages: p });
      } catch (err) { toast.error(getErrorMessage(err)); }
      finally { setLoading(false); }
    })();
  }, []);

  const exportXlsx = () => {
    let rows = [];
    let name = "";
    if (active === "users") {
      name = "users-report";
      rows = data.users.map((u) => ({
        "নাম": u.name || "",
        "ইমেইল": u.email || "",
        "মোবাইল": u.phone || "",
        "প্যাকেজ": u.packageId || "",
        "স্ট্যাটাস": u.accountStatus || "",
        "রোল": u.role || "",
        "যোগদান": toBanglaDate(u.createdAt),
      }));
    } else if (active === "subscriptions") {
      name = "subscriptions-report";
      rows = data.subscriptions.map((s) => ({
        "ইউজার আইডি": s.userId,
        "প্যাকেজ": s.packageId,
        "মূল্য": s.price || s.amountPaid || 0,
        "স্ট্যাটাস": s.status,
        "শুরু": toBanglaDate(s.startDate),
        "মেয়াদ": toBanglaDate(s.expiryDate),
      }));
    } else {
      name = "revenue-report";
      rows = data.subscriptions.map((s) => ({
        "তারিখ": toBanglaDate(s.createdAt),
        "প্যাকেজ": s.packageId,
        "পরিমাণ": s.price || s.amountPaid || 0,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${name}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("এক্সেল ডাউনলোড হয়েছে।");
  };

  const printNow = () => window.print();

  const totals = {
    users: data.users.length,
    subs: data.subscriptions.length,
    revenue: data.subscriptions.reduce(
      (s, x) => s + (Number(x.price) || Number(x.amountPaid) || 0), 0
    ),
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="রিপোর্ট"
        subtitle="ডেটা এক্সপোর্ট, প্রিন্ট ও বিশ্লেষণ।"
        actions={
          <>
            <Button variant="secondary" onClick={exportXlsx}>
              <Download className="h-4 w-4" /> XLSX
            </Button>
            <Button variant="secondary" onClick={printNow}>
              <Printer className="h-4 w-4" /> প্রিন্ট
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 no-print">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            className={`rounded-[10px] border px-3.5 py-2 text-xs transition-colors ${
              active === r.id ? "border-accent-strong bg-accent/25 text-ink" : "border-line text-muted hover:border-line-strong"
            }`}
          >
            <FileText className="mr-1 inline h-3.5 w-3.5" /> {r.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 print-area">
        <div className="glass rounded-[16px] p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted">মোট ইউজার</p>
          <p className="mt-1 text-lg font-semibold text-ink">{toBanglaNumber(totals.users)}</p>
        </div>
        <div className="glass rounded-[16px] p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted">মোট সাবস্ক্রিপশন</p>
          <p className="mt-1 text-lg font-semibold text-ink">{toBanglaNumber(totals.subs)}</p>
        </div>
        <div className="glass rounded-[16px] p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted">মোট রেভিনিউ</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatTaka(totals.revenue)}</p>
        </div>
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : (
        <Card variant="glass" className="overflow-hidden p-0 print-area">
          <div className="overflow-x-auto">
            {active === "users" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">নাম</th>
                    <th className="px-4 py-3 font-medium">ইমেইল</th>
                    <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                    <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                    <th className="px-4 py-3 font-medium">যোগদান</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? <TableEmpty colSpan={5} /> :
                    data.users.map((u) => (
                      <tr key={u.id} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-3 text-ink">{u.name || "—"}</td>
                        <td className="px-4 py-3 text-muted">{u.email}</td>
                        <td className="px-4 py-3 text-muted">{u.packageId || "free"}</td>
                        <td className="px-4 py-3 text-muted">{u.accountStatus}</td>
                        <td className="px-4 py-3 text-muted">{toBanglaDate(u.createdAt)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}

            {(active === "subscriptions" || active === "revenue") && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">ইউজার</th>
                    <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                    <th className="px-4 py-3 font-medium">পরিমাণ</th>
                    <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                    <th className="px-4 py-3 font-medium">তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscriptions.length === 0 ? <TableEmpty colSpan={5} /> :
                    data.subscriptions.map((s) => (
                      <tr key={s.id} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-3 text-xs text-muted"><code>{s.userId}</code></td>
                        <td className="px-4 py-3 text-ink">{s.packageId}</td>
                        <td className="px-4 py-3 text-ink">{formatTaka(s.price || s.amountPaid || 0)}</td>
                        <td className="px-4 py-3 text-muted">{s.status}</td>
                        <td className="px-4 py-3 text-muted">{toBanglaDate(s.createdAt)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}