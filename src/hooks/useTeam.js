import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listMembers, watchMembers, addMember, updateMember, removeMember,
} from "@/services/firebase/teamService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useTeam() {
  const { workspaceId, profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const actor = useMemo(
    () => ({ uid: profile?.uid, name: profile?.name, role: profile?.role }),
    [profile]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await listMembers(workspaceId);
      setMembers(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    const unsub = watchMembers(workspaceId, (list) => {
      setMembers(list);
      setLoading(false);
    });
    return () => unsub();
  }, [workspaceId]);

  const add = useCallback(
    async (data) => {
      await addMember(workspaceId, data, actor);
      // realtime listener will update list
    },
    [workspaceId, actor]
  );

  const update = useCallback(
    async (id, patch) => {
      await updateMember(workspaceId, id, patch);
    },
    [workspaceId]
  );

  const remove = useCallback(
    async (id) => {
      await removeMember(workspaceId, id);
    },
    [workspaceId]
  );

  return { members, loading, reload: load, add, update, remove };
}