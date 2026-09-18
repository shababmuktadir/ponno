import {
  addDoc, collection, deleteDoc, doc, getDocs, limit as qLimit,
  orderBy, query, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const NOTIFS = "notifications";
const FCM_SEND_URL = `${import.meta.env.VITE_SERVERLESS_BASE_URL || ""}/api/fcm/send`;

/* ============================================================
   LIST / CREATE
   ============================================================ */

export async function listNotifications({ max = 200 } = {}) {
  const snap = await getDocs(
    query(collection(db, NOTIFS), orderBy("createdAt", "desc"), qLimit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createNotification(data, actor) {
  if (!data?.title?.trim()) throw new Error("শিরোনাম দিন");
  if (!data?.message?.trim()) throw new Error("বার্তা দিন");

  const ref = await addDoc(collection(db, NOTIFS), {
    title: data.title.trim(),
    message: data.message.trim(),
    priority: data.priority || "normal",
    target: data.target || "all", // all | free | paid | staff | specific
    targetUserId: data.targetUserId || null,
    sendPush: data.sendPush !== false,
    createdBy: actor?.uid || null,
    createdByName: actor?.name || "",
    createdAt: serverTimestamp(),
    sentAt: null,
    pushStatus: "pending",
  });

  // Trigger push send in Worker
  if (data.sendPush !== false) {
    try {
      const tokens = await collectTokens(data.target, data.targetUserId);
      if (tokens.length > 0) {
        await fetch(FCM_SEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId: ref.id,
            title: data.title.trim(),
            message: data.message.trim(),
            url: data.url || "/notifications",
            tokens,
          }),
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[push send]", err);
    }
  }

  return ref.id;
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, NOTIFS, id));
}

/* ============================================================
   TOKEN COLLECTION BY TARGET
   ============================================================ */

async function collectTokens(target, targetUserId) {
  // Get target user docs
  let userDocs = [];

  if (target === "specific" && targetUserId) {
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "users", targetUserId));
    if (snap.exists()) userDocs.push({ id: snap.id, ...snap.data() });
  } else {
    const snap = await getDocs(query(collection(db, "users"), qLimit(500)));
    userDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (target === "free") userDocs = userDocs.filter((u) => u.accountType === "free");
    else if (target === "paid") userDocs = userDocs.filter((u) => u.accountType === "paid");
    else if (target === "staff") {
      userDocs = userDocs.filter((u) =>
        ["superAdmin", "admin", "moderator", "editor", "support"].includes(u.role)
      );
    }
  }

  // Collect FCM tokens from each user's fcmTokens subcollection
  const tokens = [];
  for (const u of userDocs) {
    try {
      const tSnap = await getDocs(collection(db, "users", u.id, "fcmTokens"));
      tSnap.docs.forEach((t) => {
        const data = t.data();
        if (data?.token) tokens.push(data.token);
      });
    } catch {
      /* ignore */
    }
  }

  return tokens;
}