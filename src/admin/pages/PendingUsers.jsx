import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserCheck, Check, X, Phone, Mail } from "lucide-react";
import {
  listUsersByStatus, approvePaidUser, rejectPaidUser,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { AdminPageHeader } from "@/admin/components/AdminUI";

export default function PendingUsers() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listUsersByStatus("pending");
      setRows(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const actor = { uid: profile?.uid, name: profile?.name, role: profile?.role };

  const approve = async (uid) => {
    setBusy(uid);
    try {
      await approvePaidUser(uid, actor);
      toast.success("অনুমোদন করা হয়েছে।");
      setRows((r) => r.filter((u) => u.id !== uid));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setBusy(null); }
  };

  const reject = async (uid) => {
    setBusy(uid);
    try {
      await rejectPaidUser(uid, actor);
      toast.success("ফ্রি অ্যাকাউন্টে রাখা হয়েছে।");
      setRows((r) => r.filter((u) => u.id !== uid));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="পেন্ডিং ইউজার"
        subtitle="পেইড অ্যাকাউন্টের অপেক্ষমাণ আবেদনসমূহ।"
        actions={
          <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-muted">
            মোট: {toBanglaNumber(rows.length)}
          </span>
        }
      />

      {loading ? (
        <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="কোনো পেন্ডিং আবেদন নেই"
          description="সব পেইড অ্যাকাউন্ট আবেদন প্রক্রিয়া করা হয়েছে।"
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((u) => (
            <Card key={u.id} variant="glass" className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{u.name || "নাম নেই"}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {u.email}
                    </span>
                    {u.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {toBanglaNumber(u.phone)}
                      </span>
                    )}
                    <span>📅 {toBanglaDate(u.createdAt)}</span>
                    {u.nid && <span>NID: {toBanglaNumber(u.nid)}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="primary" loading={busy === u.id} onClick={() => approve(u.id)}>
                    <Check className="h-3.5 w-3.5" /> অনুমোদন
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy === u.id} onClick={() => reject(u.id)}>
                    <X className="h-3.5 w-3.5" /> বাতিল
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}