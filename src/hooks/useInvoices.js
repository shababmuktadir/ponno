import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listInvoices, createInvoice, updateInvoice, deleteInvoice, finalizeInvoice,
} from "@/services/firebase/invoiceService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useInvoices({ autoLoad = true } = {}) {
  const { workspaceId, profile } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(autoLoad);

  const actor = useMemo(
    () => ({ uid: profile?.uid, name: profile?.name, role: profile?.role }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await listInvoices(workspaceId, { max: 500 });
      setInvoices(list);
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
      const id = await createInvoice(workspaceId, data, actor);
      await load();
      return id;
    },
    [workspaceId, actor, load]
  );

  const update = useCallback(
    async (id, patch) => {
      await updateInvoice(workspaceId, id, patch);
      await load();
    },
    [workspaceId, load]
  );

  const remove = useCallback(
    async (id) => {
      await deleteInvoice(workspaceId, id);
      await load();
    },
    [workspaceId, load]
  );

  const finalize = useCallback(
    async (id) => {
      await finalizeInvoice(workspaceId, id, actor);
      await load();
    },
    [workspaceId, actor, load]
  );

  return { invoices, loading, reload: load, create, update, remove, finalize };
}