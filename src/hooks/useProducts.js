import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listProducts, createProduct, updateProduct, deleteProduct,
} from "@/services/firebase/productService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useProducts({ autoLoad = true } = {}) {
  const { workspaceId, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const actor = useMemo(
    () => ({
      uid: profile?.uid,
      name: profile?.name,
      role: profile?.role,
    }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listProducts(workspaceId, { max: 500 });
      // sort newest first
      list.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setProducts(list);
    } catch (err) {
      setError(getErrorMessage(err));
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
      const id = await createProduct(workspaceId, data, actor);
      await load();
      return id;
    },
    [workspaceId, actor, load]
  );

  const update = useCallback(
    async (id, patch) => {
      await updateProduct(workspaceId, id, patch);
      await load();
    },
    [workspaceId, load]
  );

  const remove = useCallback(
    async (id) => {
      await deleteProduct(workspaceId, id);
      await load();
    },
    [workspaceId, load]
  );

  return { products, loading, error, reload: load, create, update, remove };
}