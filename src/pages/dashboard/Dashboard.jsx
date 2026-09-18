// src/pages/dashboard/Dashboard.jsx
import { useAuth } from "@/context/AuthContext";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";

const STATS = [
  { label: "মোট প্রোডাক্ট", key: "products" },
  { label: "মোট স্টক", key: "stock" },
  { label: "মোট ক্রয়", key: "purchase" },
  { label: "মোট বিক্রয়", key: "sales" },
  { label: "মোট মুনাফা", key: "profit" },
  { label: "মোট ক্ষতি", key: "loss" },
];

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">
            ড্যাশবোর্ড
          </h1>
          <p className="mt-1 text-sm text-muted">
            {toBanglaDate(new Date())} • স্বাগতম, {profile?.name || "ব্যবহারকারী"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATS.map((s) => (
          <Card key={s.key} className="p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-2 text-lg font-semibold text-ink">০</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">প্যাকেজ ব্যবহার</h2>
        <p className="mt-1 text-xs text-muted">
          বর্তমান প্যাকেজ: {profile?.packageId === "free" ? "ফ্রি" : profile?.packageId}
        </p>
        <div className="mt-4 space-y-3">
          {[
            { label: "প্রোডাক্ট", used: 0, limit: 50 },
            { label: "ক্যাটাগরি", used: 0, limit: 5 },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>{r.label}</span>
                <span>০ / ৫০</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent-strong"
                  style={{ width: `${(r.used / r.limit) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}