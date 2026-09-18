import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { MailCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resendVerification } from "@/services/firebase/authService";
import { getErrorMessage } from "@/utils/errors";
import Button from "@/components/ui/Button";

export default function VerifyEmail() {
  const { firebaseUser, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ইউজার লগইন না থাকলে লগইনে পাঠাও
    if (!firebaseUser) navigate("/login", { replace: true });
  }, [firebaseUser, navigate]);

  const checkNow = async () => {
    if (!firebaseUser) return;
    setChecking(true);
    try {
      await firebaseUser.reload();
      await refreshProfile();
      if (firebaseUser.emailVerified) {
        toast.success("ইমেইল যাচাই সম্পন্ন হয়েছে।");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("এখনো যাচাই হয়নি। ইমেইলের লিংকটি ব্যবহার করুন।");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success("যাচাই ইমেইল আবার পাঠানো হয়েছে।");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-md rounded-[18px] border border-line bg-surface p-6 text-center shadow-[var(--shadow-lift)] sm:p-8"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
        <MailCheck className="h-6 w-6 text-ink" />
      </div>

      <h1 className="mt-5 text-lg font-semibold text-ink sm:text-xl">
        ইমেইল যাচাই করুন
      </h1>
      <p className="mt-2 text-sm text-muted">
        আমরা <b className="text-ink">{firebaseUser?.email}</b> ঠিকানায় একটি
        যাচাই লিংক পাঠিয়েছি। লিংকে ক্লিক করে অ্যাকাউন্ট সক্রিয় করুন।
      </p>

      <div className="mt-6 space-y-2">
        <Button
          onClick={checkNow}
          loading={checking}
          className="w-full"
          size="lg"
        >
          যাচাই হয়েছে কি না দেখুন
        </Button>
        <Button
          variant="secondary"
          onClick={resend}
          loading={sending}
          className="w-full"
          size="lg"
        >
          <RefreshCw className="h-4 w-4" />
          ইমেইল আবার পাঠান
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted">
        ভুল ইমেইল?{" "}
        <Link to="/signup" className="text-ink underline">
          নতুন অ্যাকাউন্ট খুলুন
        </Link>
      </p>
    </motion.div>
  );
}