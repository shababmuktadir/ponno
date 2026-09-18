import { useEffect, useMemo, useState } from "react";
import {
  NavLink, Outlet, useNavigate, useLocation, Link,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@mui/material/styles";
import {
  LayoutDashboard, Users, UserCheck, Package, CreditCard,
  Wallet, Activity, Search, Bell, MessagesSquare, FileText,
  Settings, Menu as MenuIcon, X, LogOut, Moon, Sun, ShieldCheck,
  UserCog, ScrollText, ChevronRight, MoreHorizontal,
} from "lucide-react";
import Tooltip from "@mui/material/Tooltip";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/utils/cn";
import { RoleBadge } from "@/admin/components/AdminUI";
import ProfileMenu from "@/admin/components/ProfileMenu";
import UniversalSearch from "@/admin/components/UniversalSearch";
import InstallBanner from "@/components/ui/InstallBanner";
import { lightMuiTheme, darkMuiTheme } from "@/admin/theme/muiTheme";

const NAV = [
  { to: "/admin/dashboard",     label: "ড্যাশবোর্ড",       short: "হোম",       icon: LayoutDashboard, perm: "dashboard.view" },
  { to: "/admin/pending-users", label: "পেন্ডিং ইউজার",     short: "পেন্ডিং",   icon: UserCheck,       perm: "users.approve" },
  { to: "/admin/users",         label: "ইউজার লিস্ট",       short: "ইউজার",     icon: Users,           perm: "users.view" },
  { to: "/admin/search",        label: "ইউজার সার্চ",       short: "সার্চ",     icon: Search,          perm: "users.view" },
  { to: "/admin/staff",         label: "স্টাফ ম্যানেজ",     short: "স্টাফ",     icon: UserCog,         perm: "staff.manage" },
  { to: "/admin/packages",      label: "প্যাকেজ",           short: "প্যাকেজ",   icon: Package,         perm: "packages.view" },
  { to: "/admin/subscriptions", label: "সাবস্ক্রিপশন",      short: "সাবস্ক্রিপ", icon: CreditCard,      perm: "subscriptions.view" },
  { to: "/admin/earnings",      label: "আর্নিং",            short: "আর্নিং",    icon: Wallet,          perm: "earnings.view" },
  { to: "/admin/usage",         label: "ইউসেজ ট্র্যাকিং",   short: "ইউসেজ",     icon: Activity,        perm: "usage.view" },
  { to: "/admin/notifications", label: "নোটিফিকেশন",        short: "নোটিফ",     icon: Bell,            perm: "notifications.view" },
  { to: "/admin/chat",          label: "চ্যাট",             short: "চ্যাট",     icon: MessagesSquare,  perm: "chat.view" },
  { to: "/admin/reports",       label: "রিপোর্ট",           short: "রিপোর্ট",   icon: FileText,        perm: "reports.view" },
  { to: "/admin/audit",         label: "অডিট লগ",          short: "অডিট",      icon: ScrollText,      perm: "audit.view" },
  { to: "/admin/settings",      label: "সেটিংস",            short: "সেটিংস",    icon: Settings,        perm: "settings.view" },
];

const MOBILE_TABS = [
  { to: "/admin/dashboard", label: "হোম",     icon: LayoutDashboard, perm: "dashboard.view" },
  { to: "/admin/users",     label: "ইউজার",   icon: Users,           perm: "users.view" },
  { to: "/admin/packages",  label: "প্যাকেজ", icon: Package,         perm: "packages.view" },
  { to: "/admin/earnings",  label: "আর্নিং",  icon: Wallet,          perm: "earnings.view" },
];

const STORAGE_KEY = "pm.admin.sidebarCollapsed";
const COLLAPSED_W = 78;
const EXPANDED_W = 268;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [drawer, setDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const { profile, role, can, isSuperAdmin, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setDrawer(false);
    setMoreOpen(false);
  }, [location.pathname]);

  const muiTheme = useMemo(
    () => (isDark ? darkMuiTheme : lightMuiTheme),
    [isDark]
  );

  const visibleNav = useMemo(
    () => NAV.filter((n) => isSuperAdmin || can(n.perm)),
    [isSuperAdmin, can]
  );

  const mobileTabs = useMemo(
    () => MOBILE_TABS.filter((t) => isSuperAdmin || can(t.perm)),
    [isSuperAdmin, can]
  );

  const moreItems = useMemo(
    () =>
      visibleNav.filter((n) => !mobileTabs.some((t) => t.to === n.to)),
    [visibleNav, mobileTabs]
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
    <ThemeProvider theme={muiTheme}>
      <div
        className="min-h-dvh bg-bg"
        style={{ "--sidebar-w": `${sidebarW}px` }}
      >
        {/* ============================================
            DESKTOP SIDEBAR
           ============================================ */}
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
                "linear-gradient(rgba(217,207,190,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(217,207,190,.035) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage:
                "radial-gradient(ellipse at top, black 40%, transparent 75%)",
            }}
          />

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "সাইডবার খুলুন" : "সাইডবার ভাঁজ করুন"}
            className="relative flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 text-left transition-colors hover:bg-surface-2/40"
          >
                        <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] transition-transform duration-300",
                "bg-gradient-to-br from-accent-strong to-accent",
                "shadow-[0_4px_16px_-2px_rgba(201,185,148,.5)]",
                "dark:shadow-[0_0_20px_-2px_rgba(217,207,190,.45)]"
              )}
            >
              <img
                src={isDark ? "/logo-dark.png" : "/logo.png"}
                alt="লোগো"
                className="h-full w-full object-contain p-1"
              />
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
                  <p className="truncate text-sm font-semibold text-ink">
                    অ্যাডমিন প্যানেল
                  </p>
                  <p className="truncate text-[10px] text-muted">
                    {profile?.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <nav className="no-scrollbar relative flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
            {visibleNav.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                collapsed={collapsed}
                onClick={handleNavClick}
              />
            ))}
          </nav>

          <div className="relative space-y-1 border-t border-line p-3">
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

        {/* ============================================
            MOBILE DRAWER
           ============================================ */}
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
                transition={{
                  type: "tween",
                  duration: 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col border-r border-line lg:hidden",
                  "bg-bg-elevated/95 backdrop-blur-2xl"
                )}
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setDrawer(false)}
                    className="flex min-w-0 items-center gap-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-accent-strong to-accent">
                      <img
                        src={isDark ? "/logo-dark.png" : "/logo.png"}
                        alt="লোগো"
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        অ্যাডমিন প্যানেল
                      </p>
                      <p className="truncate text-[10px] text-muted">
                        {profile?.email}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => setDrawer(false)}
                    aria-label="মেনু বন্ধ"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
                  {visibleNav.map((item) => (
                    <NavItem
                      key={item.to}
                      item={item}
                      collapsed={false}
                      onClick={() => setDrawer(false)}
                    />
                  ))}
                </nav>

                <div className="shrink-0 border-t border-line p-3">
                  <div className="mb-2 px-2">
                    <RoleBadge role={role} />
                  </div>
                  <FooterButton
                    icon={LogOut}
                    label="লগআউট"
                    onClick={handleLogout}
                    collapsed={false}
                    danger
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ============================================
            MAIN AREA
           ============================================ */}
        <div className="lg:pl-[var(--sidebar-w)] lg:transition-[padding-left] lg:duration-300">
          <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/70 px-3 backdrop-blur-xl lg:hidden">
            <button
              onClick={() => setDrawer(true)}
              aria-label="মেনু খুলুন"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface-2"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <UniversalSearch compact />
            </div>
            <ProfileMenu compact />
          </header>

          <header className="no-print sticky top-0 z-20 hidden h-16 items-center gap-3 border-b border-line bg-surface/60 px-6 backdrop-blur-xl lg:flex">
            <div className="max-w-2xl flex-1">
              <UniversalSearch />
            </div>
            <div className="flex-1" />
            <ProfileMenu />
          </header>

          <main>
            <div className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 lg:px-6 lg:pb-16 lg:pt-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* ============================================
            MOBILE BOTTOM TAB BAR
           ============================================ */}
        <nav className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface/80 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${mobileTabs.length + 1}, minmax(0, 1fr))`,
            }}
          >
            {mobileTabs.map(({ to, label, icon: Icon }) => (
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
                        layoutId="admin-mobile-tab"
                        className="absolute top-0 h-[2px] w-8 rounded-b-full bg-accent-strong dark:bg-accent"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}

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

        {/* ============================================
            MOBILE "MORE" SHEET
           ============================================ */}
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
                transition={{
                  type: "tween",
                  duration: 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
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
                  {moreItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col items-center gap-2 rounded-[14px] border p-3 text-center text-[11px] transition-all",
                          isActive
                            ? "border-accent-strong bg-accent/20 text-ink dark:bg-accent/15"
                            : "border-line bg-surface/40 text-muted hover:border-line-strong hover:bg-surface-2/60 hover:text-ink"
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="line-clamp-2">{label}</span>
                    </NavLink>
                  ))}
                </div>

                <div className="mt-4 space-y-1 border-t border-line pt-3">
                  <button
                    onClick={toggle}
                    className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    {isDark ? (
                      <Sun className="h-[18px] w-[18px]" />
                    ) : (
                      <Moon className="h-[18px] w-[18px]" />
                    )}
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

        {/* ============================================
            PWA INSTALL BANNER
           ============================================ */}
        <InstallBanner />
      </div>
    </ThemeProvider>
  );
}

/* ================================================================== */

function NavItem({ item, collapsed, onClick }) {
  const Icon = item.icon;

  const body = (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-[11px] transition-all duration-200",
          collapsed
            ? "mx-auto h-11 w-11 justify-center"
            : "gap-3 px-3 py-2.5",
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
              layoutId="admin-nav-active"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-strong dark:bg-accent"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
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
        collapsed
          ? "mx-auto h-11 w-11 justify-center"
          : "gap-3 px-3 py-2.5",
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