import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
  increment,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const CHATS = "supportChats";

export async function ensureUserConversation(user) {
  if (!user?.uid) throw new Error("লগইন প্রয়োজন");

  const q = query(
    collection(db, CHATS),
    where("userId", "==", user.uid),
    qLimit(5)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    const open = docs.find((c) => c.status !== "closed") || docs[0];
    return open;
  }

  const ref = await addDoc(collection(db, CHATS), {
    userId: user.uid,
    userName: user.name || user.displayName || "ইউজার",
    userEmail: user.email || "",
    workspaceId: user.workspaceId || null,
    lastMessage: "",
    lastMessageSenderId: null,
    lastMessageSenderRole: null,
    lastAt: null,
    unreadForStaff: 0,
    unreadForUser: 0,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const created = await getDoc(ref);
  return { id: created.id, ...created.data() };
}

export function watchConversation(convId, callback) {
  return onSnapshot(
    doc(db, CHATS, convId),
    (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    },
    (err) => {
      if (import.meta.env.DEV) console.error("[chat watch]", err);
    }
  );
}

export function watchMessages(convId, callback, { max = 200 } = {}) {
  const q = query(
    collection(db, CHATS, convId, "messages"),
    orderBy("createdAt", "asc"),
    qLimit(max)
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      if (import.meta.env.DEV) console.error("[chat msgs watch]", err);
    }
  );
}

export async function sendMessage({ convId, text, sender }) {
  if (!convId) throw new Error("convId প্রয়োজন");
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("বার্তা খালি");
  if (trimmed.length > 2000) throw new Error("বার্তা অনেক বড়");

  const senderRole =
    ["superAdmin", "admin", "moderator", "editor", "support"].includes(
      sender?.role
    )
      ? "staff"
      : "user";

  const msgRef = await addDoc(collection(db, CHATS, convId, "messages"), {
    text: trimmed,
    senderId: sender.uid,
    senderRole,
    senderName: sender.name || sender.email || "",
    createdAt: serverTimestamp(),
  });

  const isStaff = senderRole === "staff";

  await updateDoc(doc(db, CHATS, convId), {
    lastMessage: trimmed.slice(0, 200),
    lastMessageSenderId: sender.uid,
    lastMessageSenderRole: senderRole,
    lastAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadForStaff: isStaff ? 0 : increment(1),
    unreadForUser: isStaff ? increment(1) : 0,
  });

  return msgRef.id;
}

export async function markConversationRead(convId, role) {
  if (!convId) return;
  const field = role === "staff" ? "unreadForStaff" : "unreadForUser";
  try {
    await updateDoc(doc(db, CHATS, convId), {
      [field]: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error("[markRead]", err);
  }
}

export function watchAllConversations(callback, { max = 100 } = {}) {
  const q = query(collection(db, CHATS), qLimit(max));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0)
        );
      callback(list);
    },
    (err) => {
      if (import.meta.env.DEV) console.error("[chat list]", err);
    }
  );
}

export async function deleteConversation(convId) {
  if (!convId) return;
  const msgsSnap = await getDocs(collection(db, CHATS, convId, "messages"));
  for (const m of msgsSnap.docs) {
    await deleteDoc(doc(db, CHATS, convId, "messages", m.id));
  }
  await deleteDoc(doc(db, CHATS, convId));
}