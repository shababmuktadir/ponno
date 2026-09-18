import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, Boxes, Wallet, Users, TrendingUp, AlertTriangle,
  Receipt, Sparkles, Lock, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import usePackage from "@/hooks/usePackage";
import useUsage from "@/hooks/useUsage";
import { listProducts } from "@/services/firebase/productService";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import FeatureLimit from "@/components/package/FeatureLimit";
import PackageBadge from "@/components/package/PackageBadge";
import { cn } from "@/utils/cn";

export default function Dashboard() {
  const { profile, workspaceId } = useAuth();
  const { pkg, isFree } = usePackage();
  const { used: productUsed } = useUsage("products", "productLimit");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!workspaceId) return;
      try {
        const list = await listProducts(workspaceId, { max: 200 });
        if (!cancel) setProducts(list);
      } catch {
        /* ignore */
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [workspaceId]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce(
      (sum, p) => sum + (Number(p.currentStock) || 0),
      0
    );
    const stockValue = products.reduce(
      (sum, p) => sum + (Number(p.currentStock) || 0) * (Number(p.buyUnitPrice) || 0),
      0
    );
    const lowStock = products.filter(
      (p) => (Number(p.currentStock) || 0) < 5
    ).length;
    return { totalProducts, totalStock, stockValue, lowStock };
  }, [products]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            ড্যাশবোর্ড
          </h1>
          <p className="mt-1 text-sm text-muted">
            {toBanglaDate(new Date())} • স্বাগতম, {profile?.name || "ব্যবহারকারী"}
          </p>
        </div>
        <PackageBadge />
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="মোট প্রোডাক্ট"
          value={loading ? "…" : toBanglaNumber(stats.totalProducts)}
          icon={Package}
        />
        <StatCard
          label="মোট স্টক"
          value={loading ? "…" : toBanglaNumber(stats.totalStock)}
          icon={Boxes}
        />
        <StatCard
          label="স্টক মূল্য"
          value={loading ? "…" : formatTaka(stats.stockValue)}
          icon={Wallet}
        />
        <StatCard
          label="কম স্টক"
          value={loading ? "…" : toBanglaNumber(stats.lowStock)}
          icon={AlertTriangle}
          tone={stats.lowStock > 0 ? "warning" : "ink"}
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          to="/products"
          icon={Package}
          label="প্রোডাক্ট"
          desc="নতুন যোগ করুন বা এডিট করুন"
        />
        <QuickLink
          to="/stock"
          icon={Boxes}
          label="স্টক"
          desc="স্টকের হিসাব ও ট্র্যাকিং"
        />
        <QuickLink
          to="/earnings"
          icon={TrendingUp}
          label="আয়"
          desc="লাভ ক্ষতির হিসাব"
        />
      </div>

      {/* Usage & package */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="glass" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-strong" />
            <h2 className="text-sm font-semibold text-ink">
              প্যাকেজ ব্যবহার
            </h2>
          </div>
          <div className="space-y-4">
            <FeatureLimit
              usageKey="products"
              limitKey="productLimit"
              label="প্রোডাক্ট"
            />
            <FeatureLimit
              usageKey="categories"
              limitKey="categoryLimit"
              label="ক্যাটাগরি"
            />
            <FeatureLimit
              usageKey="customers"
              limitKey="customerLimit"
              label="কাস্টমার"
            />
          </div>
          {isFree && (
            <div className="mt-4 rounded-[12px] border border-accent-strong/40 bg-accent/15 p-3 text-xs">
              <p className="text-ink">
                আপনি এখন ফ্রি প্যাকেজে আছেন — আরো ফিচারের জন্য আপগ্রেড করুন।
              </p>
            </div>
          )}
        </Card>

        {/* Recent products */}
        <Card variant="glass" className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-accent-strong" />
              <h2 className="text-sm font-semibold text-ink">
                সাম্প্রতিক প্রোডাক্ট
              </h2>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink"
            >
              সব দেখুন
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-muted">লোড হচ্ছে…</p>
          ) : products.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              এখনো কোনো প্রোডাক্ট নেই
            </p>
          ) : (
            <div className="space-y-2">
              {products.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-[10px] border border-line bg-surface/40 p-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-surface-2 text-subtle">
                    <Package className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{p.name}</p>
                    <p className="truncate text-[10px] text-muted">
                      {p.model || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-ink">
                    {toBanglaNumber(p.currentStock || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "ink" }) {
  const toneClass =
    tone === "warning"
      ? "bg-warning/15 text-warning"
      : "bg-ink text-bg dark:bg-accent dark:text-accent-fg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass" className="p-4">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[10px]",
            toneClass
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 text-[10px] uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      </Card>
    </motion.div>
  );
}

function QuickLink({ to, icon: Icon, label, desc }) {
  return (
    <Link to={to}>
      <Card
        variant="glass"
        className="group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent/25 text-accent-fg">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{label}</p>
          <p className="truncate text-[11px] text-muted">{desc}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}