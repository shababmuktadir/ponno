// src/pages/auth/Suspended.jsx
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

export default function Suspended() {
  const { logout } = useAuth();
  return (
    <div className="mx-auto max-w-md card p-6 text-center">
      <h1 className="text-lg font-semibold text-ink">অ্যাকাউন্ট নিষ্ক্রিয়</h1>
      <p className="mt-2 text-sm text-muted">
        আপনার অ্যাকাউন্টটি সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে। সহায়তার জন্য যোগাযোগ করুন।
      </p>
      <Button className="mt-5 w-full" variant="secondary" onClick={logout}>
        লগআউট
      </Button>
    </div>
  );
}