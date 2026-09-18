import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function AccessDenied() {
  const { logout, profile } = useAuth();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-strong w-full max-w-md rounded-[20px] p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
          <ShieldAlert className="h-6 w-6 text-danger" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-ink">প্রবেশাধিকার নেই</h1>
        <p className="mt-2 text-sm text-muted">
          আপনার অ্যাকাউন্টটি অ্যাডমিন অনুমোদিত নয়।
        </p>
        {profile?.email && (
          <p className="mt-1 text-xs text-subtle">{profile.email}</p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button as={Link} to="/dashboard" className="w-full">
            ড্যাশবোর্ডে যান
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
          >
            লগআউট
          </Button>
        </div>
      </div>
    </div>
  );
}