import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import FullPageLoader from "@/components/ui/FullPageLoader";
import Button from "@/components/ui/Button";

function AuthErrorScreen({ message }) {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-strong w-full max-w-md rounded-[20px] p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-ink">প্রোফাইল লোড করা যায়নি</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            আবার চেষ্টা করুন
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

// ---------- Protected (normal user area) ----------
export function ProtectedRoute({ children }) {
  const { firebaseUser, profile, loading, authError, isSuspended, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (authError) return <AuthErrorScreen message={authError} />;
  if (!firebaseUser)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (!profile)
    return <AuthErrorScreen message="প্রোফাইল ডকুমেন্ট পাওয়া যায়নি।" />;
  if (isSuspended) return <Navigate to="/suspended" replace />;

  // স্টাফ হলে সরাসরি admin dashboard-এ পাঠিয়ে দাও (user dashboard লাগবে না)
  if (isStaff && location.pathname === "/dashboard") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

// ---------- Admin ----------
export function AdminRoute({ children, permission }) {
  const { firebaseUser, profile, loading, authError, isStaff, can } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (authError) return <AuthErrorScreen message={authError} />;

  if (!firebaseUser)
    return <Navigate to="/login" replace state={{ from: location }} />;

  if (!profile)
    return <AuthErrorScreen message="প্রোফাইল পাওয়া যায়নি।" />;

  if (!isStaff) return <Navigate to="/admin/denied" replace />;

  if (permission && !can(permission))
    return <Navigate to="/admin/denied" replace />;

  return children;
}

// ---------- Guest (login/signup) ----------
// Role দেখে সঠিক dashboard-এ পাঠায়
export function GuestRoute({ children }) {
  const { firebaseUser, profile, loading, isStaff } = useAuth();

  if (loading) return <FullPageLoader />;

  if (firebaseUser && profile) {
    return <Navigate to={isStaff ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return children;
}