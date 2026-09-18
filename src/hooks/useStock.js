import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listTransactions, createTransaction, deleteTransaction,
} from "@/services/firebase/stockService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useStock({ autoLoad = true, productId } = {}) {
  const { workspaceId, profile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(autoLoad);

  const actor = useMemo(
    () => ({ uid: profile?.uid, name: profile?.name, role: profile?.role }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await listTransactions(workspaceId, { max: 500, productId });
      setTransactions(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, productId]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  const create = useCallback(
    async (data) => {
      const result = await createTransaction(workspaceId, data, actor);
      await load();
      return result;
    },
    [workspaceId, actor, load]
  );

  const remove = useCallback(
    async (id) => {
      await deleteTransaction(workspaceId, id);
      await load();
    },
    [workspaceId, load]
  );

  return { transactions, loading, reload: load, create, remove };
}