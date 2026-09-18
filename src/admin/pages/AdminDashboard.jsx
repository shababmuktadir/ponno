import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Users, UserCheck, CreditCard, Package, Wallet, Activity,
  ShieldAlert, Bell, TrendingUp, TrendingDown, Sparkles, Zap,
  UserPlus, PackagePlus, Send, ScrollText, ArrowRight, Crown,
  BarChart3, PieChart as PieIcon, Clock, CheckCircle2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

import { getDashboardStats } from "@/admin/services/adminService";
import { getErrorMessage } from "@/utils/errors";
import Card from "@/components/ui/Card";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate, toBanglaDateTime } from "@/utils/banglaDate";
import { cn } from "@/utils/cn";
import { ROLE_LABELS } from "@/config/roles";
import { APP_VERSION } from "@/config/version";

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */
const STAT_CARDS = [
  {
    key: "totalUsers",
    label: "মোট ইউজার",
    icon: Users,
    tone: "ink",
    to: "/admin/users",
  },
  {
    key: "freeUsers",
    label: "ফ্রি ইউজার",
    icon: Users,
    tone: "muted",
    to: "/admin/users",
  },
  {
    key: "paidUsers",
    label: "পেইড ইউজার",
    icon: Crown,
    tone: "accent",
    to: "/admin/subscriptions",
  },
  {
    key: "pending",
    label: "পেন্ডিং",
    icon: UserCheck,
    tone: "warning",
    to: "/admin/pending-users",
  },
  {
    key: "activeSubs",
    label: "সক্রিয় সাবস্ক্রিপশন",
    icon: CreditCard,
    tone: "success",
    to: "/admin/subscriptions",
  },
  {
    key: "totalPackages",
    label: "মোট প্যাকেজ",
    icon: Package,
    tone: "ink",
    to: "/admin/packages",
  },
];

const TONE_CLASSES = {
  ink: "from-ink/90 to-ink text-bg dark:from-accent-strong dark:to-accent dark:text-accent-fg",
  accent: "from-accent-strong to-accent text-accent-fg",
  success: "from-success/25 to-success/10 text-success",
  warning: "from-warning/25 to-warning/10 text-warning",
  danger: "from-danger/25 to-danger/10 text-danger",
  muted: "from-surface-2 to-surface-3 text-muted",
};

const QUICK_ACTIONS = [
  {
    label: "পেন্ডিং ইউজার",
    icon: UserCheck,
    to: "/admin/pending-users",
    tone: "warning",
  },
  {
    label: "নতুন প্যাকেজ",
    icon: PackagePlus,
    to: "/admin/packages",
    tone: "success",
  },
  {
    label: "নোটিফিকেশন",
    icon: Send,
    to: "/admin/notifications",
    tone: "accent",
  },
  {
    label: "স্টাফ ম্যানেজ",
    icon: UserPlus,
    to: "/admin/staff",
    tone: "ink",
  },
  {
    label: "অডিট লগ",
    icon: ScrollText,
    to: "/admin/audit",
    tone: "muted",
  },
];

/* ------------------------------------------------------------------ */
/*  ANIMATED COUNTER                                                   */
/* ------------------------------------------------------------------ */
function AnimatedNumber({ value, money = false, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => mv.set(Number(value) || 0), delay);
      return () => clearTimeout(t);
    }
  }, [inView, value, delay, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(v));
    return () => unsub();
  }, [spring]);

  return (
    <span ref={ref}>
      {money ? formatTaka(Math.round(display)) : toBanglaNumber(Math.round(display))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  STAT CARD                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ card, value, loading, index }) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.05 + index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link to={card.to}>
        <Card
          variant="glass"
          className="group relative overflow-hidden p-4 transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br",
                TONE_CLASSES[card.tone] || TONE_CLASSES.ink
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            <ArrowRight className="h-3.5 w-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
          </div>

          <p className="mt-3 text-[11px] uppercase tracking-wider text-muted">
            {card.label}
          </p>

          <p className="mt-1 text-2xl font-semibold text-ink">
            {loading ? (
              <span className="inline-block h-6 w-12 animate-pulse rounded bg-surface-2" />
            ) : (
              <AnimatedNumber value={value} />
            )}
          </p>

          {/* Glow */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/25 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:bg-accent/15" />
        </Card>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CUSTOM TOOLTIP                                                     */
/* ------------------------------------------------------------------ */
function BanglaTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-[10px] px-3 py-2 text-xs">
      <p className="font-medium text-ink">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 text-muted">
          {money ? formatTaka(p.value) : toBanglaNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                              */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s = await getDashboardStats();
        if (cancelled) return;
        setStats(s);

        // Load recent users (first 6)
        const { listUsers } = await import("@/admin/services/adminService");
        const list = await listUsers({ max: 200 });
        if (cancelled) return;

        const sorted = [...list].sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });
        setUsers(sorted.slice(0, 6));
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Derived chart data ---------- */
  const signupSeries = useMemo(() => {
    const days = 7;
    const buckets = {};
    const labels = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = toBanglaDate(d).split(" ").slice(0, 2).join(" ");
      buckets[key] = 0;
      labels.push({ key, label });
    }

    users.forEach((u) => {
      const t = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : null;
      if (!t) return;
      const key = new Date(t).toISOString().slice(0, 10);
      if (key in buckets) buckets[key]++;
    });

    return labels.map((l) => ({ day: l.label, count: buckets[l.key] }));
  }, [users]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "ফ্রি", value: stats.freeUsers || 0, color: "#8B8B92" },
      { name: "পেইড", value: stats.paidUsers || 0, color: "#C9B994" },
      { name: "স্টাফ", value: stats.staffUsers || 0, color: "#3F6B4A" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const revenueByMonth = useMemo(() => {
    // Simple mock — replace with real query later
    if (!stats) return [];
    return [
      { m: "এই মাস", v: stats.monthRevenue || 0 },
      { m: "মোট", v: stats.totalRevenue || 0 },
    ];
  }, [stats]);

  /* ---------- Loading ---------- */
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ==================================================
          HERO HEADER
         ================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[22px] border border-line bg-gradient-to-br from-surface/70 to-surface-2/50 p-6 backdrop-blur-xl dark:from-[rgba(20,20,24,.7)] dark:to-[rgba(30,30,36,.4)]"
      >
        {/* Animated orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/40 blur-3xl dark:bg-accent/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-accent-strong/25 blur-3xl dark:bg-accent-strong/8"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-strong/50 bg-accent/25 px-2.5 py-0.5 text-[10px] font-semibold text-accent-fg">
                <Sparkles className="h-3 w-3" />
                নতুন ড্যাশবোর্ড
              </span>
              <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
                v{APP_VERSION}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              অ্যাডমিন ড্যাশবোর্ড
            </h1>
            <p className="mt-1 text-sm text-muted">
              {toBanglaDate(new Date())} • প্ল্যাটফর্মের সার্বিক অবস্থা এক
              নজরে
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs text-muted backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              লাইভ
            </span>
          </div>
        </div>
      </motion.div>

      {/* ==================================================
          STAT CARDS
         ================================================== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            card={card}
            value={stats?.[card.key] ?? 0}
            loading={loading}
            index={i}
          />
        ))}
      </section>

      {/* ==================================================
          CHARTS ROW
         ================================================== */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Signups area chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card variant="glass" className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent-strong" />
                <h2 className="text-sm font-semibold text-ink">
                  সাপ্তাহিক সাইনআপ
                </h2>
              </div>
              <span className="text-[11px] text-muted">
                শেষ ৭ দিন • মোট {toBanglaNumber(users.length)}
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={signupSeries}
                  margin={{ top: 4, right: 8, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9B994" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#C9B994" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 6"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RTooltip content={<BanglaTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#C9B994"
                    strokeWidth={2}
                    fill="url(#signupGrad)"
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Package distribution pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="glass" className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-accent-strong" />
              <h2 className="text-sm font-semibold text-ink">
                প্যাকেজ ডিস্ট্রিবিউশন
              </h2>
            </div>

            {pieData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted">
                এখনো কোনো ডেটা নেই
              </div>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={3}
                        animationDuration={1000}
                      >
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.color} stroke="none" />
                        ))}
                      </Pie>
                      <RTooltip content={<BanglaTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-2">
                  {pieData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 text-muted">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: d.color }}
                        />
                        {d.name}
                      </span>
                      <span className="font-medium text-ink">
                        {toBanglaNumber(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </section>

      {/* ==================================================
          REVENUE MINI + ACTIVITY ROW
         ================================================== */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Revenue card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card variant="glass" className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent-strong" />
              <h2 className="text-sm font-semibold text-ink">রেভিনিউ</h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-[14px] border border-accent-strong/40 bg-accent/15 p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  এই মাসে
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatTaka(stats?.monthRevenue || 0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[12px] border border-line bg-surface/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    মোট
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {formatTaka(stats?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="rounded-[12px] border border-line bg-surface/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    সাবস্ক্রিপশন
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {toBanglaNumber(stats?.activeSubs || 0)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent users */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card variant="glass" className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-strong" />
                <h2 className="text-sm font-semibold text-ink">
                  সাম্প্রতিক ইউজার
                </h2>
              </div>
              <Link
                to="/admin/users"
                className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink"
              >
                সব দেখুন
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {users.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                এখনো কোনো ইউজার নেই
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((u, i) => {
                  const initials = (u.name || u.email || "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("");
                  const isSuper = u.role === "superAdmin";
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.45 + i * 0.05 }}
                    >
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="flex items-center gap-3 rounded-[12px] border border-transparent p-2 transition-all hover:border-line hover:bg-surface-2/60"
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold",
                            isSuper
                              ? "bg-gradient-to-br from-accent-strong to-accent text-accent-fg"
                              : "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                          )}
                        >
                          {initials || "?"}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {u.name || "—"}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {u.email}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            u.accountStatus === "active"
                              ? "border-success/40 bg-success/10 text-success"
                              : u.accountStatus === "pending"
                              ? "border-warning/40 bg-warning/10 text-warning"
                              : "border-line bg-surface-2 text-muted"
                          )}
                        >
                          {u.accountStatus === "active"
                            ? "সক্রিয়"
                            : u.accountStatus === "pending"
                            ? "পেন্ডিং"
                            : u.accountStatus}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </section>

      {/* ==================================================
          QUICK ACTIONS
         ================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card variant="glass" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent-strong" />
            <h2 className="text-sm font-semibold text-ink">দ্রুত অ্যাকশন</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.to + action.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.55 + i * 0.04 }}
                >
                  <Link
                    to={action.to}
                    className="group flex flex-col items-center gap-2 rounded-[14px] border border-line bg-surface/50 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2/60 hover:shadow-[var(--shadow-md)]"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br transition-transform group-hover:scale-105",
                        TONE_CLASSES[action.tone] || TONE_CLASSES.ink
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-medium text-ink">
                      {action.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.section>

      {/* ==================================================
          FOOTER HINT
         ================================================== */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="text-center text-[11px] text-subtle"
      >
        সংস্করণ v{APP_VERSION} • সর্বশেষ আপডেট{" "}
        {toBanglaDateTime(new Date())}
      </motion.p>

      {error && (
        <p className="text-center text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SKELETON                                                           */
/* ------------------------------------------------------------------ */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-[22px] bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[16px] bg-surface-2"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-72 animate-pulse rounded-[16px] bg-surface-2" />
        <div className="h-72 animate-pulse rounded-[16px] bg-surface-2" />
      </div>
    </div>
  );
}