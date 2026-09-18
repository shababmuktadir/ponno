// src/layouts/DashboardLayout.jsx
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Tags, Boxes, BarChart3, Wallet, FileText,
  Receipt, Users, UserCog, MessageSquare, MessagesSquare, Bell, Settings,
  Menu, X, LogOut, Moon, Sun, MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/utils/cn";

const NAV = [
  { to: "/dashboard",     label: "ড্যাশবোর্ড",        icon: LayoutDashboard },
  { to: "/products",      label: "প্রোডাক্ট",          icon: Package },
  { to: "/categories",    label: "ক্যাটাগরি",          icon: Tags },
  { to: "/stock",         label: "স্টক",               icon: Boxes },
  { to: "/stock/dashboard", label: "স্টক ড্যাশবোর্ড",  icon: BarChart3 },
  { to: "/earnings",      label: "আয়",                icon: Wallet },
  { to: "/reports",       label: "রিপোর্ট",            icon: FileText },
  { to: "/invoices",      label: "ইনভয়েস",            icon: Receipt },
  { to: "/customers",     label: "কাস্টমার",           icon: Users },
  { to: "/team",          label: "ইউজার",              icon: UserCog },
  { to: "/sms",           label: "এসএমএস",             icon: MessageSquare },
  { to: "/chat",          label: "চ্যাট",              icon: MessagesSquare },
  { to: "/notifications", label: "নোটিফিকেশন",         icon: Bell },
  { to: "/settings",      label: "সেটিংস",             icon: Settings },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/products",  label: "প্রোডাক্ট",  icon: Package },
  { to: "/stock",     label: "স্টক",       icon: Boxes },
  { to: "/earnings",  label: "আয়",        icon: Wallet },
];

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/stock"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-surface-2 font-medium text-ink"
            : "text-muted hover:bg-surface-2 hover:text-ink"
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export default function DashboardLayout() {
  const [drawer, setDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { profile, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const businessName = profile?.businessName || profile?.name || "আমার বিজনেস";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-bg">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-bg-elevated lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-line px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink text-sm font-bold text-bg dark:bg-accent dark:text-accent-fg">
            {(businessName || "ব").trim().charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{businessName}</p>
            <p className="truncate text-xs text-muted">
              {profile?.packageId === "free" ? "ফ্রি প্যাকেজ" : profile?.packageId}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-line p-3">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            {isDark ? "লাইট মোড" : "ডার্ক মোড"}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" />
            লগআউট
          </button>
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line glass px-4 lg:hidden">
        <button
          onClick={() => setDrawer(true)}
          aria-label="মেনু খুলুন"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-surface-2"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs font-bold text-bg dark:bg-accent dark:text-accent-fg">
            {(businessName || "ব").trim().charAt(0)}
          </div>
          <span className="truncate text-sm font-semibold">{businessName}</span>
        </div>
        <button
          onClick={toggle}
          aria-label="থিম পরিবর্তন"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-surface-2"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* ---------- Mobile drawer ---------- */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawer(false)}
              className="no-print fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="no-print fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col border-r border-line bg-bg-elevated lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <span className="text-sm font-semibold">মেনু</span>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="মেনু বন্ধ করুন"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-surface-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {NAV.map((item) => (
                  <SidebarLink key={item.to} item={item} onNavigate={() => setDrawer(false)} />
                ))}
              </nav>
              <div className="border-t border-line p-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  লগআউট
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---------- Content ---------- */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">
          <Outlet />
        </div>
      </main>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-line glass pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                  isActive ? "text-ink" : "text-muted"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted"
          >
            <MoreHorizontal className="h-5 w-5" />
            আরও
          </button>
        </div>
      </nav>

      {/* "আরও" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="no-print fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="no-print fixed bottom-0 left-0 right-0 z-50 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-bg-elevated p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] lg:hidden"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
              <div className="grid grid-cols-3 gap-2">
                {NAV.filter((n) => !MOBILE_NAV.some((m) => m.to === n.to)).map(
                  ({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-[12px] border border-line p-3 text-center text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </NavLink>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}