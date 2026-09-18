// src/layouts/AuthLayout.jsx
import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthLayout() {
  return (
    <div className="relative min-h-dvh">
      {/* Top brand bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-ink text-[13px] font-bold text-bg shadow-[var(--shadow-sm)] dark:bg-accent dark:text-accent-fg">
            প
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-ink">প্রোডাক্ট ম্যানেজমেন্ট</p>
            <p className="text-[11px] text-muted">বাংলা SaaS প্ল্যাটফর্ম</p>
          </div>
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-64px)] items-center justify-center px-4 pb-10 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}