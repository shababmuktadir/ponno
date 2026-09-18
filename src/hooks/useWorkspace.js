import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { getWorkspace } from "@/services/firebase/userService";

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function useWorkspace() {
  const { workspaceId } = useAuth() || {};
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(Boolean(workspaceId));
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!workspaceId) {
      setWorkspace(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    let pollingTimer = null;
    let cancelled = false;

    const startPolling = () => {
      if (pollingTimer) return;
      const fetchNow = async () => {
        try {
          const ws = await getWorkspace(workspaceId);
          if (cancelled) return;
          setWorkspace(ws);
          setLoading(false);
        } catch (err) {
          if (import.meta.env.DEV) console.error("[useWorkspace poll]", err);
          if (!cancelled) setLoading(false);
        }
      };
      fetchNow();
      pollingTimer = setInterval(fetchNow, POLL_INTERVAL);
    };

    try {
      const ref = doc(db, "workspaces", workspaceId);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (cancelled) return;
          setWorkspace(snap.exists() ? { id: snap.id, ...snap.data() } : null);
          setLoading(false);
          setError(null);
        },
        (err) => {
          if (import.meta.env.DEV)
            console.error("[useWorkspace realtime]", err?.message);
          // fallback
          if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
          }
          startPolling();
        }
      );
      unsubRef.current = unsub;
    } catch (err) {
      if (import.meta.env.DEV) console.error("[useWorkspace setup]", err);
      startPolling();
    }

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [workspaceId]);

  return { workspace, loading, error };
}