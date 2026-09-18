import {
  collection, deleteDoc, doc, getDocs, limit as qLimit, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const NOTIFS = "notifications";

/* ============================================================
   LIST — visible to user based on target
   ============================================================ */

export function watchUserNotifications(user, callback, { max = 100 } = {}) {
  if (!user?.uid) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, NOTIFS),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );

  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const visible = all.filter((n) => {
        const t = n.target || "all";
        const accountType = user.accountType || "free";
        const role = user.role || "user";

        if (t === "all") return true;
        if (t === "free" && accountType === "free") return true;
        if (t === "paid" && accountType === "paid") return true;
        if (t === "staff") {
          return ["superAdmin", "admin", "moderator", "editor", "support"].includes(role);
        }
        if (t === "specific" && n.targetUserId === user.uid) return true;
        return false;
      });

      callback(visible);
    },
    (err) => {
      if (import.meta.env.DEV) console.error("[notifications watch]", err);
    }
  );
}

/* ============================================================
   MARK READ / DELETE
   ============================================================ */

/**
 * Notifications are global — a per-user read-marker is stored
 * in users/{uid}/notificationReads/{notificationId}
 */
export async function markNotificationRead(uid, notificationId) {
  if (!uid || !notificationId) return;
  const ref = doc(db, "users", uid, "notificationReads", notificationId);
  await updateDoc(ref, {
    readAt: serverTimestamp(),
  }).catch(async () => {
    // create if not exists
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, { readAt: serverTimestamp() });
  });
}

export async function getReadNotificationIds(uid) {
  if (!uid) return new Set();
  const snap = await getDocs(collection(db, "users", uid, "notificationReads"));
  return new Set(snap.docs.map((d) => d.id));
}

export async function markAllRead(uid, notificationIds = []) {
  if (!uid || !notificationIds.length) return;
  const { writeBatch, setDoc } = await import("firebase/firestore");
  const batch = writeBatch(db);
  notificationIds.forEach((id) => {
    const ref = doc(db, "users", uid, "notificationReads", id);
    batch.set(ref, { readAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function deleteUserNotification(uid, notificationId) {
  // Deleting a user's own marker — not the actual notification
  if (!uid || !notificationId) return;
  await deleteDoc(doc(db, "users", uid, "notificationReads", notificationId));
}