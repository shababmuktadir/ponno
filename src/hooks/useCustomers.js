import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listCustomers, createCustomer, updateCustomer, deleteCustomer,
} from "@/services/firebase/customerService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useCustomers({ autoLoad = true } = {}) {
  const { workspaceId, profile } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(autoLoad);

  const actor = useMemo(
    () => ({ uid: profile?.uid, name: profile?.name, role: profile?.role }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await listCustomers(workspaceId, { max: 2000 });
      setCustomers(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  const create = useCallback(
    async (data) => {
      const id = await createCustomer(workspaceId, data, actor);
      await load();
      return id;
    },
    [workspaceId, actor, load]
  );

  const update = useCallback(
    async (id, patch) => {
      await updateCustomer(workspaceId, id, patch);
      await load();
    },
    [workspaceId, load]
  );

  const remove = useCallback(
    async (id) => {
      await deleteCustomer(workspaceId, id);
      await load();
    },
    [workspaceId, load]
  );

  return { customers, loading, reload: load, create, update, remove };
}