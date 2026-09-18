import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/services/firebase/authService";
import { getErrorMessage } from "@/utils/errors";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("ইমেইল দিন।");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("সঠিক ইমেইল দিন।");
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("রিসেট লিংক পাঠানো হয়েছে।");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-md rounded-[18px] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-8"
    >
      <Link
        to="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        লগইনে ফিরে যান
      </Link>

      <h1 className="text-lg font-semibold text-ink sm:text-xl">
        পাসওয়ার্ড রিসেট
      </h1>
      <p className="mt-1 text-sm text-muted">
        আপনার অ্যাকাউন্টের ইমেইল দিন — রিসেট লিংক পাঠানো হবে।
      </p>

      {sent ? (
        <div className="mt-6 rounded-[12px] border border-line bg-surface-2 p-4 text-sm text-ink">
          ✓ {email} ঠিকানায় একটি রিসেট লিংক পাঠানো হয়েছে। ইনবক্স দেখুন।
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="relative">
            <Input
              label="ইমেইল"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
              className="pl-10"
            />
            <Mail className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-subtle" />
          </div>
          <Button type="submit" loading={loading} className="w-full" size="lg">
            রিসেট লিংক পাঠান
          </Button>
        </form>
      )}
    </motion.div>
  );
}