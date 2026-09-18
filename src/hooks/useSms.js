import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listSmsHistory, logSms, deleteSms,
} from "@/services/firebase/smsHistoryService";
import { sendSMS, getSMSBalance, normalizePhoneForSMS } from "@/services/api/smsService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useSms({ autoLoad = true } = {}) {
  const { workspaceId, profile } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const actor = useMemo(
    () => ({ uid: profile?.uid, name: profile?.name, role: profile?.role }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await listSmsHistory(workspaceId, { max: 500 });
      setHistory(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const data = await getSMSBalance();
      let b = null;
      if (data?.raw) {
        try {
          const parsed = JSON.parse(data.raw);
          b = parsed.balance;
        } catch {
          b = data.raw;
        }
      }
      setBalance(b);
      return b;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return null;
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const send = useCallback(
    async ({ phone, message, customerId, customerName }) => {
      const normalized = normalizePhoneForSMS(phone);
      try {
        const res = await sendSMS({ phone: normalized, message });

        // Log success
        await logSms(
          workspaceId,
          {
            phone: normalized,
            message,
            customerId,
            customerName,
            status: res.success ? "sent" : "failed",
            messageId: res.messageId || null,
            errorMessage: res.errorMessage || null,
          },
          actor
        );

        if (!res.success) {
          throw new Error(res.errorMessage || "SMS পাঠানো যায়নি");
        }

        await load();
        return res;
      } catch (err) {
        // Log failure
        try {
          await logSms(
            workspaceId,
            {
              phone: normalized,
              message,
              customerId,
              customerName,
              status: "failed",
              errorMessage: err.message,
            },
            actor
          );
          await load();
        } catch {}
        throw err;
      }
    },
    [workspaceId, actor, load]
  );

  const remove = useCallback(
    async (id) => {
      await deleteSms(workspaceId, id);
      await load();
    },
    [workspaceId, load]
  );

  return {
    history,
    loading,
    balance,
    balanceLoading,
    reload: load,
    send,
    remove,
    fetchBalance,
  };
}