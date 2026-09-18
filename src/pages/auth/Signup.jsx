import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { User, Mail, Phone, Lock, CreditCard, ShieldCheck } from "lucide-react";
import { signupUser } from "@/services/firebase/authService";
import { getErrorMessage } from "@/utils/errors";
import { cn } from "@/utils/cn";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const ACCOUNT_TYPES = [
  {
    value: "free",
    title: "ফ্রি অ্যাকাউন্ট",
    desc: "সীমিত ফিচার, তাৎক্ষণিক শুরু",
  },
  {
    value: "paid",
    title: "পেইড অ্যাকাউন্ট",
    desc: "সব ফিচার, যাচাইয়ের পরে সক্রিয়",
  },
];

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    nid: "",
    accountType: "free",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "নাম লিখুন।";
    if (!form.email.trim()) e.email = "ইমেইল দিন।";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "সঠিক ইমেইল দিন।";

    if (!form.phone.trim()) e.phone = "মোবাইল নম্বর দিন।";
    else if (!/^01[3-9]\d{8}$/.test(form.phone.replace(/\D/g, "")))
      e.phone = "সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)।";

    if (!form.password) e.password = "পাসওয়ার্ড দিন।";
    else if (form.password.length < 8)
      e.password = "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।";

    if (form.password !== form.confirm)
      e.confirm = "পাসওয়ার্ড মিলছে না।";

    if (!form.nid.trim()) e.nid = "NID নম্বর দিন।";
    else if (form.nid.replace(/\D/g, "").length < 10)
      e.nid = "NID কমপক্ষে ১০ ডিজিটের হতে হবে।";

    if (!form.terms) e.terms = "শর্তাবলীতে সম্মতি দিন।";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const workspaceId = crypto.randomUUID();
      await signupUser({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        nid: form.nid,
        accountType: form.accountType,
        workspaceId,
      });
      toast.success(
        form.accountType === "paid"
          ? "অ্যাকাউন্ট তৈরি হয়েছে। যাচাই প্রক্রিয়াধীন।"
          : "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল যাচাই করুন।"
      );
      navigate("/verify-email", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[20px] border border-line bg-surface shadow-[var(--shadow-lift)] lg:grid-cols-[1fr_1.15fr]">
      {/* বাম দিকের branding — ডেস্কটপে */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-bg lg:flex">
        <div className="relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent text-sm font-bold text-accent-fg">
            প
          </div>
          <h2 className="mt-6 text-2xl font-semibold leading-snug">
            একটি অ্যাকাউন্ট,<br />সম্পূর্ণ ব্যবসার হিসাব।
          </h2>
          <p className="mt-3 max-w-sm text-sm text-bg/70">
            প্রোডাক্ট, ক্যাটাগরি, স্টক, বিক্রয়, ইনভয়েস, রিপোর্ট —
            সব একটি নিরাপদ ওয়ার্কস্পেসে।
          </p>
        </div>

        <div className="relative z-10 space-y-3 text-sm text-bg/70">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> নিরাপদ ডেটা আইসোলেশন
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> মোবাইল ও ডেস্কটপে প্রস্তুত
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> PWA হিসেবে ইনস্টলযোগ্য
          </p>
        </div>

        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
      </div>

      {/* ফর্ম */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="p-6 sm:p-8 lg:p-10"
      >
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-ink text-sm font-bold text-bg dark:bg-accent dark:text-accent-fg">
            প
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">প্রোডাক্ট ম্যানেজমেন্ট</p>
            <p className="text-xs text-muted">নতুন অ্যাকাউন্ট</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-ink sm:text-2xl">সাইনআপ করুন</h1>
        <p className="mt-1 text-sm text-muted">
          নিচের তথ্য দিয়ে নতুন অ্যাকাউন্ট তৈরি করুন।
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {/* Account type */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">অ্যাকাউন্টের ধরন</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ACCOUNT_TYPES.map((t) => {
                const active = form.accountType === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => set("accountType", t.value)}
                    className={cn(
                      "rounded-[12px] border p-3 text-left transition-all",
                      active
                        ? "border-accent-strong bg-surface-2"
                        : "border-line hover:border-line-strong"
                    )}
                  >
                    <p className="text-sm font-medium text-ink">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input
                label="নাম"
                name="name"
                placeholder="আপনার পূর্ণ নাম"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
                required
                className="pl-10"
              />
              <User className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
            </div>

            <div className="relative">
              <Input
                label="মোবাইল নম্বর"
                name="phone"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                error={errors.phone}
                required
                className="pl-10"
              />
              <Phone className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
            </div>
          </div>

          <div className="relative">
            <Input
              label="ইমেইল"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
              className="pl-10"
            />
            <Mail className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
          </div>

          <div className="relative">
            <Input
              label="NID নম্বর"
              name="nid"
              inputMode="numeric"
              placeholder="জাতীয় পরিচয়পত্র নম্বর"
              value={form.nid}
              onChange={(e) => set("nid", e.target.value)}
              error={errors.nid}
              required
              className="pl-10"
            />
            <CreditCard className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input
                label="পাসওয়ার্ড"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                error={errors.password}
                hint="অন্তত ৮ অক্ষর"
                required
                className="pl-10"
              />
              <Lock className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
            </div>

            <div className="relative">
              <Input
                label="পাসওয়ার্ড নিশ্চিতকরণ"
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                error={errors.confirm}
                required
                className="pl-10"
              />
              <Lock className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-line p-3">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set("terms", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent-strong)]"
            />
            <span className="text-xs text-muted">
              আমি সেবার শর্তাবলী ও গোপনীয়তা নীতিতে সম্মত আছি।
            </span>
          </label>
          {errors.terms && (
            <p className="-mt-2 text-xs text-danger">{errors.terms}</p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            অ্যাকাউন্ট তৈরি করুন
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          <Link to="/login" className="font-medium text-ink hover:underline">
            লগইন করুন
          </Link>
        </p>
      </motion.div>
    </div>
  );
}