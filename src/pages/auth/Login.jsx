import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { loginUser, fetchUserDoc } from "@/services/firebase/authService";
import { getErrorMessage } from "@/utils/errors";
import { SUPER_ADMIN_UID, STAFF_ROLES } from "@/config/roles";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "ইমেইল দিন।";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "সঠিক ইমেইল দিন।";
    if (!form.password) e.password = "পাসওয়ার্ড দিন।";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const cred = await loginUser(form.email, form.password);

      // ---- Role detect ----
      const uid = cred.user.uid;
      const profileDoc = await fetchUserDoc(uid).catch(() => null);

      const isSuperAdmin = uid === SUPER_ADMIN_UID;
      const role = profileDoc?.role || "user";
      const isStaff = isSuperAdmin || STAFF_ROLES.includes(role);

      // ---- Suspended check ----
      if (profileDoc?.accountStatus === "suspended") {
        toast.error("আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে।");
        navigate("/suspended", { replace: true });
        return;
      }

      // ---- Redirect ----
      if (isStaff) {
        toast.success("অ্যাডমিন প্যানেলে স্বাগতম।");
        navigate(from && from.startsWith("/admin") ? from : "/admin/dashboard", {
          replace: true,
        });
      } else {
        toast.success("সফলভাবে লগইন হয়েছে।");
        navigate(from && !from.startsWith("/admin") ? from : "/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      {/* ---------- Left showcase (desktop only) ---------- */}
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="glass-panel relative hidden flex-col justify-between rounded-[28px] p-10 lg:flex"
      >
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted">
            <Sparkles className="h-3 w-3" />
            প্রিমিয়াম SaaS প্ল্যাটফর্ম
          </span>

          <h1 className="mt-7 text-[34px] font-semibold leading-[1.15] tracking-tight text-ink">
            আপনার ব্যবসা,
            <br />
            <span className="text-gradient">সম্পূর্ণ নিয়ন্ত্রণে।</span>
          </h1>

          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
            প্রোডাক্ট, স্টক, বিক্রয়, ইনভয়েস আর রিপোর্ট — সব একসাথে,
            একটি নিরাপদ বাংলা ওয়ার্কস্পেসে।
          </p>
        </div>

        <div className="relative z-10 mt-10 space-y-3">
          {[
            { icon: ShieldCheck, text: "নিরাপদ ডেটা আইসোলেশন" },
            { icon: Zap,         text: "মোবাইল ও ডেস্কটপে সমান গতি" },
            { icon: Sparkles,    text: "PWA হিসেবে ইনস্টলযোগ্য" },
          ].map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3 rounded-[14px] border border-line bg-surface/60 px-4 py-3 backdrop-blur-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-bg dark:bg-accent dark:text-accent-fg">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[13px] text-ink">{text}</span>
            </motion.div>
          ))}
        </div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-line/60" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full border border-line/40" />
      </motion.aside>

      {/* ---------- Form card ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative rounded-[24px] p-6 sm:p-8 lg:p-10"
      >
        <div className="mx-auto max-w-sm">
          <h2 className="text-[22px] font-semibold tracking-tight text-ink sm:text-[24px]">
            আবার স্বাগতম
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন।
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <Input
              label="ইমেইল"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="পাসওয়ার্ড"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-muted transition-colors hover:text-ink"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              প্রবেশ করুন
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] text-subtle">অথবা</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <p className="text-center text-sm text-muted">
            অ্যাকাউন্ট নেই?{" "}
            <Link
              to="/signup"
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              সাইনআপ করুন
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}