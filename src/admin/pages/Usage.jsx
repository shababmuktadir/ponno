import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Search, RefreshCw, Users, Package, Boxes, Wallet } from "lucide-react";
import {
  collection, getDocs, limit as qLimit, onSnapshot, query,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader, TableEmpty } from "@/admin/components/AdminUI";
import { cn } from "@/utils/cn";

export default function Usage() {
  const [users, setUsers] = useState([]);
  const [usageMap, setUsageMap] = useState({});
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  /* ---------- Load users (once) ---------- */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), qLimit(500))
        );
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    })();
  }, []);

  /* ---------- Load packages (once) ---------- */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "packages"), qLimit(200))
        );
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setPackages(map);
      } catch {}
    })();
  }, []);

  /* ---------- Realtime usage listener (all docs) ---------- */
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "usage"), qLimit(500)),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setUsageMap(map);
        setLoading(false);
      },
      (err) => {
        console.error("[usage realtime]", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /* ---------- Filter + enrich ---------- */
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .map((u) => {
        const u_ = usageMap[u.workspaceId] || {};
        const pkg = packages[u.packageId] || {};
        const limits = pkg.limits || {};

        const getLim = (id) => {
          const l = limits[id];
          if (!l) return null;
          if (l.unlimited) return "unlimited";
          return Number(l.value) || 0;
        };

        return {
          id: u.id,
          name: u.name || "—",
          email: u.email || "",
          package: pkg.name || u.packageId || "—",
          workspaceId: u.workspaceId,
          products: u_.products || 0,
          productLim: getLim("productLimit"),
          categories: u_.categories || 0,
          categoryLim: getLim("categoryLimit"),
          customers: u_.customers || 0,
          customerLim: getLim("customerLimit"),
          users: u_.users || 1,
          userLim: getLim("userLimit"),
          storage: u_.storage || 0,
          storageLim: getLim("storage"),
          invoices: u_.invoices || 0,
          sms: u_.sms || 0,
          lastAt: u_.updatedAt,
        };
      })
      .filter((r) => {
        if (!term) return true;
        return (
          r.name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          (r.workspaceId || "").toLowerCase().includes(term)
        );
      });
  }, [users, usageMap, packages, q]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="রিয়েল-টাইম ইউসেজ ট্র্যাকিং"
        subtitle="প্রতিটি ওয়ার্কস্পেসের ব্যবহার লাইভ আপডেট।"
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1 sm:max-w-md">
          <Input
            placeholder="ইউজার বা ওয়ার্কস্পেস…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">
          লোড হচ্ছে…
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="কোনো ইউসেজ ডেটা নেই"
          description="ইউজার প্রোডাক্ট/কাস্টমার যোগ করলে এখানে দেখা যাবে"
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card variant="glass" className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">ইউজার</th>
                    <th className="px-4 py-3 font-medium">প্যাকেজ</th>
                    <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                    <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                    <th className="px-4 py-3 font-medium">কাস্টমার</th>
                    <th className="px-4 py-3 font-medium">ইউজার</th>
                    <th className="px-4 py-3 font-medium">স্টোরেজ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3">
                        <p className="truncate text-ink">{r.name}</p>
                        <p className="truncate text-[10px] text-muted">
                          {r.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">{r.package}</td>
                      <td className="px-4 py-3">
                        <UsageCell value={r.products} limit={r.productLim} />
                      </td>
                      <td className="px-4 py-3">
                        <UsageCell value={r.categories} limit={r.categoryLim} />
                      </td>
                      <td className="px-4 py-3">
                        <UsageCell value={r.customers} limit={r.customerLim} />
                      </td>
                      <td className="px-4 py-3">
                        <UsageCell value={r.users} limit={r.userLim} />
                      </td>
                      <td className="px-4 py-3">
                        <UsageCell
                          value={r.storage}
                          limit={r.storageLim}
                          suffix="MB"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {rows.map((r) => (
              <Card key={r.id} variant="glass" className="p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.name}
                  </p>
                  <p className="truncate text-[11px] text-muted">{r.email}</p>
                  <p className="mt-0.5 text-[10px] text-subtle">
                    {r.package}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <UsageCell value={r.products} limit={r.productLim} label="প্রোডাক্ট" />
                  <UsageCell value={r.categories} limit={r.categoryLim} label="ক্যাটাগরি" />
                  <UsageCell value={r.customers} limit={r.customerLim} label="কাস্টমার" />
                  <UsageCell value={r.users} limit={r.userLim} label="ইউজার" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UsageCell({ value, limit, label, suffix = "" }) {
  const used = Number(value) || 0;
  const unlimited = limit === "unlimited";
  const lim = unlimited ? 0 : Number(limit) || 0;

  const pct = unlimited || lim === 0 ? 0 : Math.min(100, Math.round((used / lim) * 100));
  const tone =
    unlimited
      ? "text-muted"
      : pct >= 100
      ? "text-danger"
      : pct >= 80
      ? "text-warning"
      : "text-ink";

  return (
    <div>
      {label && (
        <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted">
          {label}
        </p>
      )}
      <p className={cn("text-sm font-medium tabular-nums", tone)}>
        {toBanglaNumber(used)}
        {!unlimited && lim > 0 && ` / ${toBanglaNumber(lim)}`}
        {unlimited && " / ∞"}
        {suffix && ` ${suffix}`}
      </p>
      {!unlimited && lim > 0 && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct >= 100
                ? "bg-danger"
                : pct >= 80
                ? "bg-warning"
                : "bg-accent-strong"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}