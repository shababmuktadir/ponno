import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  onSnapshot, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const WS = "workspaces";

function membersCol(workspaceId) {
  return collection(db, WS, workspaceId, "members");
}

/* ============================================================
   LIST
   ============================================================ */

export async function listMembers(workspaceId) {
  if (!workspaceId) return [];
  const snap = await getDocs(membersCol(workspaceId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function watchMembers(workspaceId, callback) {
  if (!workspaceId) return () => {};
  return onSnapshot(
    membersCol(workspaceId),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      if (import.meta.env.DEV) console.error("[members watch]", err);
    }
  );
}

/* ============================================================
   CREATE — add helper
   Requires the helper to have signed up first (uid exists)
   ============================================================ */

export async function addMember(workspaceId, data, actor) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");
  if (!data?.uid) throw new Error("UID প্রয়োজন");
  if (!data?.email) throw new Error("ইমেইল প্রয়োজন");

  // Check if already member
  const existing = await getDoc(doc(db, WS, workspaceId, "members", data.uid));
  if (existing.exists()) {
    throw new Error("এই ব্যবহারকারী ইতিমধ্যে টিমে আছে");
  }

  await addDoc(membersCol(workspaceId), {
    uid: data.uid,
    name: data.name || "সদস্য",
    email: data.email,
    phone: data.phone || "",
    role: data.role || "helper",
    permissions: data.permissions || defaultPermissions(),
    status: "active",
    addedBy: actor?.uid || null,
    addedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Also link the member's user doc to this workspace
  try {
    await updateDoc(doc(db, "users", data.uid), {
      workspaceId,
      role: "helper",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("[addMember] user doc update failed:", err.message);
  }
}

/* ============================================================
   UPDATE — permissions / role / status
   ============================================================ */

export async function updateMember(workspaceId, memberId, patch) {
  if (!workspaceId || !memberId) throw new Error("id প্রয়োজন");
  await updateDoc(doc(db, WS, workspaceId, "members", memberId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
   REMOVE
   ============================================================ */

export async function removeMember(workspaceId, memberId) {
  if (!workspaceId || !memberId) throw new Error("id প্রয়োজন");
  await deleteDoc(doc(db, WS, workspaceId, "members", memberId));
}

/* ============================================================
   DEFAULT PERMISSIONS
   ============================================================ */

export const PERMISSION_KEYS = [
  { id: "product.view", label: "প্রোডাক্ট দেখা" },
  { id: "product.add", label: "প্রোডাক্ট যোগ" },
  { id: "product.edit", label: "প্রোডাক্ট এডিট" },
  { id: "product.delete", label: "প্রোডাক্ট ডিলিট" },
  { id: "category.view", label: "ক্যাটাগরি দেখা" },
  { id: "category.add", label: "ক্যাটাগরি যোগ" },
  { id: "category.edit", label: "ক্যাটাগরি এডিট" },
  { id: "stock.view", label: "স্টক দেখা" },
  { id: "stock.add", label: "স্টক যোগ" },
  { id: "customer.view", label: "কাস্টমার দেখা" },
  { id: "customer.add", label: "কাস্টমার যোগ" },
  { id: "invoice.create", label: "ইনভয়েস তৈরি" },
  { id: "report.view", label: "রিপোর্ট দেখা" },
  { id: "sms.send", label: "SMS পাঠান" },
  { id: "chat.use", label: "চ্যাট ব্যবহার" },
];

export function defaultPermissions() {
  return {
    "product.view": true,
    "category.view": true,
    "stock.view": true,
    "customer.view": true,
    "report.view": true,
  };
}