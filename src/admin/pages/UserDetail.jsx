import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Ban, Check, Package, Wallet,
} from "lucide-react";
import {
  getUser, updateUser, suspendUser, reactivateUser,
  assignPackageToUser, listPackages, getUserWorkspaceData,
} from "@/admin/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { toBanglaNumber } from "@/utils/banglaNumber";
import { toBanglaDate, toBanglaDateTime } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  AdminPageHeader, RoleBadge, StatusBadge,
} from "@/admin/components/AdminUI";

export default function UserDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, can } = useAuth();
  const [user, setUser] = useState(null);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [assign, setAssign] = useState({ packageId: "", durationDays: 30 });

  const actor = { uid: profile?.uid, name: profile?.name, role: profile?.role };

  const load = async () => {
    setLoading(true);
    try {
      const [u, pkgs] = await Promise.all([getUser(uid), listPackages()]);
      setUser(u);
      setEditName(u?.name || "");
      setEditPhone(u?.phone || "");
      setPackages(pkgs);
      if (u?.workspaceId) {
        const wd = await getUserWorkspaceData(u.workspaceId);
        setWorkspaceData(wd);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [uid]);

  if (loading) return <Card variant="glass" className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</Card>;
  if (!user) return (
    <Card variant="glass" className="p-8 text-center text-sm text-muted">
      ইউজার পাওয়া যায়নি।
    </Card>
  );

  const isSuper = user.role === "superAdmin" || user.id === "IfTBq2rSXWIk6ZdcKol9fUZH7r1";

  const saveBasics = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, { name: editName, phone: editPhone }, actor);
      toast.success("আপডেট হয়েছে।");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleSuspend = async () => {
    try {
      if (user.accountStatus === "suspended") await reactivateUser(user.id, actor);
      else await suspendUser(user.id, actor);
      toast.success("আপডেট হয়েছে।");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const doAssign = async () => {
    if (!assign.packageId) return toast.error("প্যাকেজ নির্বাচন করুন।");
    setSaving(true);
    try {
      await assignPackageToUser(user.id, assign.packageId, assign.durationDays, actor);
      toast.success("প্যাকেজ অ্যাসাইন করা হয়েছে।");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> ফিরে যান
      </button>

      <AdminPageHeader
        title={user.name || "ইউজার"}
        subtitle={user.email}
        actions={
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role || "user"} />
            <StatusBadge status={user.accountStatus} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Basic info */}
        <Card variant="glass" className="p-5">
          <h2 className="text-sm font-semibold text-ink">মৌলিক তথ্য</h2>
          <div className="mt-4 space-y-3">
            <Input label="নাম" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input label="মোবাইল" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            <div className="rounded-[12px] border border-line bg-surface/50 p-3 text-xs text-muted">
              <p>UID: <code className="text-ink">{user.id}</code></p>
              <p className="mt-1">ইমেইল verified: {user.emailVerified ? "হ্যাঁ" : "না"}</p>
              <p className="mt-1">যোগদান: {toBanglaDateTime(user.createdAt)}</p>
              {user.nid && <p className="mt-1">NID: {toBanglaNumber(user.nid)}</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={saveBasics} loading={saving} className="flex-1">
                <Save className="h-4 w-4" /> সংরক্ষণ
              </Button>
              {!isSuper && can("users.suspend") && (
                <Button
                  variant={user.accountStatus === "suspended" ? "secondary" : "danger"}
                  onClick={toggleSuspend}
                >
                  {user.accountStatus === "suspended" ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {user.accountStatus === "suspended" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Subscription */}
        <Card variant="glass" className="p-5">
          <h2 className="text-sm font-semibold text-ink">সাবস্ক্রিপশন</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-[12px] border border-line bg-surface/50 p-3 text-sm">
              <p className="text-muted">বর্তমান প্যাকেজ</p>
              <p className="mt-1 text-ink">{user.packageId || "free"}</p>
              {user.subscriptionExpiry && (
                <p className="mt-2 text-xs text-muted">
                  মেয়াদ: {toBanglaDate(user.subscriptionExpiry)}
                </p>
              )}
            </div>

            {can("subscriptions.manage") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">প্যাকেজ</label>
                    <select
                      value={assign.packageId}
                      onChange={(e) => setAssign({ ...assign, packageId: e.target.value })}
                      className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink backdrop-blur-md"
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value="free">ফ্রি</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="মেয়াদ (দিন)"
                    type="number"
                    min="1"
                    value={assign.durationDays}
                    onChange={(e) => setAssign({ ...assign, durationDays: e.target.value })}
                  />
                </div>
                <Button onClick={doAssign} loading={saving} className="w-full">
                  <Package className="h-4 w-4" /> প্যাকেজ অ্যাসাইন
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Workspace data summary */}
      {user.workspaceId && workspaceData && (
        <Card variant="glass" className="p-5">
          <h2 className="text-sm font-semibold text-ink">ওয়ার্কস্পেস ডেটা</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { l: "প্রোডাক্ট", v: workspaceData.products.length },
              { l: "ক্যাটাগরি", v: workspaceData.categories.length },
              { l: "কাস্টমার", v: workspaceData.customers.length },
              { l: "ইনভয়েস", v: workspaceData.invoices.length },
              { l: "স্টক ট্রানজেকশন", v: workspaceData.stockTx.length },
            ].map((s) => (
              <div key={s.l} className="rounded-[12px] border border-line bg-surface/50 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted">{s.l}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{toBanglaNumber(s.v)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">
            Workspace: <code className="text-ink">{user.workspaceId}</code>
          </p>
        </Card>
      )}
    </div>
  );
}