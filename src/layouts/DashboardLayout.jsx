import { useEffect, useMemo, useState } from "react";
import {
  NavLink, Outlet, useNavigate, useLocation, Link,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Tags, Boxes, BarChart3, Wallet, FileText,
  Receipt, Users, UserCog, MessageSquare, MessagesSquare, Bell, Settings,
  Menu as MenuIcon, X, LogOut, Moon, Sun, MoreHorizontal, ShieldCheck,
  ChevronRight, Lock,
} from "lucide-react";
import Tooltip from "@mui/material/Tooltip";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useBranding } from "@/hooks/useBranding";
import usePackage from "@/hooks/usePackage";
import PackageBadge from "@/components/package/PackageBadge";
import { cn } from "@/utils/cn";

/* ------------------------------------------------------------------
   NAV
   ------------------------------------------------------------------ */
const NAV = [
  { to: "/dashboard",       label: "ড্যাশবোর্ড",        short: "হোম",       icon: LayoutDashboard, page: "dashboard" },
  { to: "/products",        label: "প্রোডাক্ট",          short: "প্রোডাক্ট",  icon: Package,         page: "product" },
  { to: "/categories",      label: "ক্যাটাগরি",          short: "ক্যাটাগরি",  icon: Tags,            page: "category" },
  { to: "/stock",           label: "স্টক",              short: "স্টক",      icon: Boxes,           page: "stock" },
  { to: "/stock/dashboard", label: "স্টক ড্যাশবোর্ড",    short: "স্টক ড্যাশ", icon: BarChart3,       page: "stockDashboard" },
  { to: "/earnings",        label: "আয়",               short: "আয়",       icon: Wallet,          page: "income" },
  { to: "/reports",         label: "রিপোর্ট",           short: "রিপোর্ট",   icon: FileText,        page: "report" },
  { to: "/invoices",        label: "ইনভয়েস",           short: "ইনভয়েস",   icon: Receipt,         page: "invoice" },
  { to: "/customers",       label: "কাস্টমার",          short: "কাস্টমার",  icon: Users,           page: "customer" },
  { to: "/team",            label: "ইউজার",             short: "ইউজার",     icon: UserCog,         page: "user" },
  { to: "/sms",             label: "এসএমএস",            short: "এসএমএস",    icon: MessageSquare,   page: "sms" },
  { to: "/chat",            label: "চ্যাট",             short: "চ্যাট",     icon: MessagesSquare,  page: "chat" },
  { to: "/notifications",   label: "নোটিফিকেশন",        short: "নোটিফ",     icon: Bell,            page: "notification" },
  { to: "/settings",        label: "সেটিংস",            short: "সেটিংস",    icon: Settings,        page: "settings" },
];

const MOBILE_TABS = [
  { to: "/dashboard", label: "হোম",      icon: LayoutDashboard, page: "dashboard" },
  { to: "/products",  label: "প্রোডাক্ট", icon: Package,         page: "product" },
  { to: "/stock",     label: "স্টক",     icon: Boxes,           page: "stock" },
  { to: "/earnings",  label: "আয়",      icon: Wallet,          page: "income" },
];

const STORAGE_KEY = "pm.user.sidebarCollapsed";
const COLLAPSED_W = 78;
const EXPANDED_W = 268;

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [drawer, setDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const { logout, isStaff } = useAuth();
  const { isDark, toggle } = useTheme();
  const branding = useBranding();
  const { isPageAccessible } = usePackage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    setDrawer(false);
    setMoreOpen(false);
  }, [location.pathname]);

  const displayName = branding.dashboardName || "আমার ব্যবসা";
  const logoUrl = branding.logoUrl;

  const moreItems = useMemo(
    () => NAV.filter((n) => !MOBILE_TABS.some((t) => t.to === n.to)),
    []
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleNavClick = () => {
    if (collapsed) setCollapsed(false);
  };

  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <div
      className="min-h-dvh bg-bg"
      style={{ "--sidebar-w": `${sidebarW}px` }}
    >
      {/* ============ DESKTOP SIDEBAR ============ */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarW }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.7 }}
        className={cn(
          "no-print fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-line lg:flex",
          "bg-bg-elevated/65 backdrop-blur-2xl",
          "dark:bg-[rgba(12,12,14,0.68)]"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 dark:opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(rgba(217,207,190,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(217,207,190,.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
          }}
        />

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "সাইডবার খুলুন" : "সাইডবার ভাঁজ করুন"}
          className="relative flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 text-left transition-colors hover:bg-surface-2/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-line bg-surface-solid shadow-[var(--shadow-sm)]">
            {logoUrl ? (
              <img src={logoUrl} alt={displayName} className="h-full w-full object-contain p-0.5" />
            ) : (
              <span className="text-sm font-bold text-ink">
                {(displayName || "ব").trim().charAt(0)}
              </span>
            )}
          </span>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                <p className="truncate text-[10px] text-muted">
                  {branding.phone || "ড্যাশবোর্ড"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <nav className="no-scrollbar relative flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          {NAV.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              locked={!isPageAccessible(item.page)}
              onClick={handleNavClick}
            />
          ))}
        </nav>

        <div className="relative space-y-2 border-t border-line p-3">
          {!collapsed && (
            <div className="px-1 pb-1">
              <PackageBadge />
            </div>
          )}

          {isStaff && (
            <Link
              to="/admin/dashboard"
              className={cn(
                "flex w-full items-center rounded-[11px] text-sm transition-colors",
                collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2.5",
                "text-accent-strong hover:bg-accent/15"
              )}
              title="অ্যাডমিন প্যানেল"
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>অ্যাডমিন প্যানেল</span>}
            </Link>
          )}

          <FooterButton
            icon={isDark ? Sun : Moon}
            label={isDark ? "লাইট মোড" : "ডার্ক মোড"}
            onClick={toggle}
            collapsed={collapsed}
          />
          <FooterButton
            icon={LogOut}
            label="লগআউট"
            onClick={handleLogout}
            collapsed={collapsed}
            danger
          />
        </div>
      </motion.aside>

      {/* Floating expand */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            key="float-expand"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setCollapsed(false)}
            aria-label="সাইডবার খুলুন"
            className={cn(
              "no-print fixed left-[66px] top-[68px] z-40 hidden h-7 w-7 items-center justify-center rounded-full",
              "border border-line bg-bg-elevated shadow-[var(--shadow-md)]",
              "text-muted transition-colors hover:text-ink lg:flex"
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ============ MOBILE DRAWER ============ */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col border-r border-line bg-bg-elevated/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
                <Link to="/dashboard" onClick={() => setDrawer(false)} className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-line bg-surface-solid">
                    {logoUrl ? (
                      <img src={logoUrl} alt={displayName} className="h-full w-full object-contain p-0.5" />
                    ) : (
                      <span className="text-xs font-bold text-ink">
                        {(displayName || "ব").trim().charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                    <p className="truncate text-[10px] text-muted">ড্যাশবোর্ড</p>
                  </div>
                </Link>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="বন্ধ"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
                {NAV.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    collapsed={false}
                    locked={!isPageAccessible(item.page)}
                    onClick={() => setDrawer(false)}
                  />
                ))}
              </nav>

              <div className="shrink-0 border-t border-line p-3">
                <div className="mb-2 px-1">
                  <PackageBadge />
                </div>
                {isStaff && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setDrawer(false)}
                    className="mb-2 flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-accent-strong hover:bg-accent/15"
                  >
                    <ShieldCheck className="h-[18px] w-[18px]" />
                    অ্যাডমিন প্যানেল
                  </Link>
                )}
                <FooterButton icon={LogOut} label="লগআউট" onClick={handleLogout} collapsed={false} danger />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ============ MAIN AREA ============ */}
      <div className="lg:pl-[var(--sidebar-w)] lg:transition-[padding-left] lg:duration-300">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/70 px-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            aria-label="মেনু খুলুন"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface-2"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-solid">
              {logoUrl ? (
                <img src={logoUrl} alt={displayName} className="h-full w-full object-contain p-0.5" />
              ) : (
                <span className="text-[11px] font-bold text-ink">
                  {(displayName || "ব").trim().charAt(0)}
                </span>
              )}
            </div>
            <span className="truncate text-sm font-semibold text-ink">{displayName}</span>
          </div>
          <button
            onClick={toggle}
            aria-label="থিম পরিবর্তন"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface-2"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        <main>
          <div className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 lg:px-6 lg:pb-16 lg:pt-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${MOBILE_TABS.length + 1}, minmax(0, 1fr))` }}>
          {MOBILE_TABS.map(({ to, label, icon: Icon, page }) => {
            const locked = !isPageAccessible(page);
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                    isActive ? "text-ink" : "text-muted"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="user-mobile-tab"
                        className="absolute top-0 h-[2px] w-8 rounded-b-full bg-accent-strong"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative">
                      <Icon className="h-5 w-5" />
                      {locked && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface-solid">
                          <Lock className="h-2.5 w-2.5 text-danger" />
                        </span>
                      )}
                    </span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
              moreOpen ? "text-ink" : "text-muted"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>আরও</span>
          </button>
        </div>
      </nav>

      {/* ============ MOBILE "MORE" SHEET ============ */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "no-print fixed bottom-0 left-0 right-0 z-50 max-h-[75dvh] overflow-y-auto",
                "rounded-t-[24px] border-t border-line bg-bg-elevated/95 backdrop-blur-2xl",
                "p-3 pb-[calc(env(safe-area-inset-bottom)+16px)] lg:hidden"
              )}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />

              <div className="mb-3 flex items-center justify-between px-2">
                <p className="text-sm font-semibold text-ink">সব মেনু</p>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="বন্ধ"
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-surface-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {moreItems.map(({ to, label, icon: Icon, page }) => {
                  const locked = !isPageAccessible(page);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "relative flex flex-col items-center gap-2 rounded-[14px] border p-3 text-center text-[11px] transition-all",
                          isActive
                            ? "border-accent-strong bg-accent/20 text-ink"
                            : "border-line bg-surface/40 text-muted hover:border-line-strong hover:bg-surface-2/60 hover:text-ink"
                        )
                      }
                    >
                      <span className="relative">
                        <Icon className="h-5 w-5" />
                        {locked && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-bg-elevated">
                            <Lock className="h-2.5 w-2.5 text-danger" />
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2">{label}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="mt-4 space-y-1 border-t border-line pt-3">
                {isStaff && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMoreOpen(false)}
                    className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-accent-strong hover:bg-accent/15"
                  >
                    <ShieldCheck className="h-[18px] w-[18px]" />
                    অ্যাডমিন প্যানেল
                  </Link>
                )}
                <button
                  onClick={toggle}
                  className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                  {isDark ? "লাইট মোড" : "ডার্ক মোড"}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  লগআউট
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- NavItem ---------------- */
function NavItem({ item, collapsed, locked, onClick }) {
  const Icon = item.icon;

  const body = (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-[11px] transition-all duration-200",
          collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-surface-2 font-medium text-ink shadow-[var(--shadow-xs)] backdrop-blur-md dark:bg-[rgba(217,207,190,0.08)] dark:shadow-[0_0_0_1px_rgba(217,207,190,0.15),0_0_18px_-2px_rgba(217,207,190,0.35)]"
            : "text-muted hover:bg-surface-2/70 hover:text-ink"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <motion.span
              layoutId="user-nav-active"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-strong"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative shrink-0">
            <Icon className="h-[18px] w-[18px]" />
            {locked && (
              <span className="absolute -right-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface-solid">
                <Lock className="h-2.5 w-2.5 text-danger" />
              </span>
            )}
          </span>
          {!collapsed && (
            <span className="flex-1 truncate text-sm">{item.label}</span>
          )}
          {!collapsed && locked && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-danger/70" />
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip title={locked ? `${item.label} (লকড)` : item.label} placement="right" arrow>
        <span>{body}</span>
      </Tooltip>
    );
  }
  return body;
}

function FooterButton({ icon: Icon, label, onClick, collapsed, danger }) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-[11px] text-sm transition-colors",
        collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2.5",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        <span className="block">{content}</span>
      </Tooltip>
    );
  }
  return content;
}