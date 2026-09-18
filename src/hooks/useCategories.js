import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from "@/services/firebase/categoryService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useCategories({ autoLoad = true } = {}) {
  const { workspaceId, profile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(autoLoad);

  const actor = useMemo(
    () => ({ uid: profile?.uid, name: profile?.name, role: profile?.role }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await listCategories(workspaceId, { max: 500 });
      setCategories(list);
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
      const id = await createCategory(workspaceId, data, actor);
      await load();
      return id;
    },
    [workspaceId, actor, load]
  );

  const update = useCallback(
    async (id, patch) => {
      await updateCategory(workspaceId, id, patch);
      await load();
    },
    [workspaceId, load]
  );

  const remove = useCallback(
    async (id) => {
      await deleteCategory(workspaceId, id);
      await load();
    },
    [workspaceId, load]
  );

  return { categories, loading, reload: load, create, update, remove };
}