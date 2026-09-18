// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-5xl font-bold text-ink">৪০৪</p>
      <p className="text-sm text-muted">আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।</p>
      <Button as={Link} to="/dashboard">ড্যাশবোর্ডে ফিরে যান</Button>
    </div>
  );
}