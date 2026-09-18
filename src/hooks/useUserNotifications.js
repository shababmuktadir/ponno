import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  watchUserNotifications, getReadNotificationIds, markAllRead,
  markNotificationRead,
} from "@/services/firebase/userNotificationService";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errors";

export default function useUserNotifications() {
  const { profile, uid } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  /* ---------- Load read markers ---------- */
  useEffect(() => {
    if (!uid) return;
    getReadNotificationIds(uid).then(setReadIds).catch(() => {});
  }, [uid]);

  /* ---------- Realtime notifications ---------- */
  useEffect(() => {
    if (!uid || !profile) return;
    setLoading(true);
    const unsub = watchUserNotifications(
      {
        uid,
        accountType: profile.accountType,
        role: profile.role,
      },
      (list) => {
        setNotifications(list);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid, profile]);

  /* ---------- Mark single read ---------- */
  const markRead = useCallback(
    async (id) => {
      if (!uid || readIds.has(id)) return;
      try {
        await markNotificationRead(uid, id);
        setReadIds((s) => new Set([...s, id]));
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [uid, readIds]
  );

  /* ---------- Mark all read ---------- */
  const markAll = useCallback(async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => !readIds.has(n.id));
    if (!unread.length) return;
    try {
      await markAllRead(uid, unread.map((n) => n.id));
      setReadIds((s) => new Set([...s, ...unread.map((n) => n.id)]));
      toast.success("সব পড়া হিসেবে চিহ্নিত");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [uid, notifications, readIds]);

  /* ---------- Enriched list ---------- */
  const enriched = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        isRead: readIds.has(n.id),
      })),
    [notifications, readIds]
  );

  const unreadCount = useMemo(
    () => enriched.filter((n) => !n.isRead).length,
    [enriched]
  );

  return {
    notifications: enriched,
    unreadCount,
    loading,
    markRead,
    markAll,
  };
}