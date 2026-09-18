// src/pages/Placeholder.jsx
import EmptyState from "@/components/ui/EmptyState";
import { Construction } from "lucide-react";

export default function Placeholder({ title = "পেজ" }) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
      <EmptyState
        icon={Construction}
        title="এই অংশটি তৈরি করা হচ্ছে"
        description="পরবর্তী ধাপে এই পেজটি সম্পূর্ণ কার্যকর করা হবে।"
      />
    </div>
  );
}