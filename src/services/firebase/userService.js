import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/config/firebase";

const USERS = "users";
const WORKSPACES = "workspaces";

/* ---------------- USER ---------------- */

export async function getMe(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateMe(uid, patch) {
  const clean = { ...patch };

  // Never let the client accidentally overwrite security fields
  delete clean.role;
  delete clean.accountType;
  delete clean.accountStatus;
  delete clean.packageId;
  delete clean.subscriptionStatus;
  delete clean.subscriptionStart;
  delete clean.subscriptionExpiry;
  delete clean.workspaceId;
  delete clean.uid;
  delete clean.email;
  delete clean.createdAt;

  try {
    await updateDoc(doc(db, USERS, uid), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("[updateMe] Firestore error:", {
        code: err?.code,
        message: err?.message,
        patch: clean,
        uid,
      });
    }
    throw err;
  }

  // Keep Firebase Auth in sync (best-effort)
  if (auth.currentUser && (clean.name || clean.photoURL)) {
    await updateProfile(auth.currentUser, {
      displayName: clean.name ?? auth.currentUser.displayName,
      photoURL: clean.photoURL ?? auth.currentUser.photoURL,
    }).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn("[updateProfile] Auth error (non-fatal):", err?.code);
      }
    });
  }
}

/* ---------------- WORKSPACE ---------------- */

export async function getWorkspace(workspaceId) {
  if (!workspaceId) return null;
  const snap = await getDoc(doc(db, WORKSPACES, workspaceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createWorkspaceIfMissing(workspaceId, ownerId, ownerName) {
  if (!workspaceId) return null;
  const ref = doc(db, WORKSPACES, workspaceId);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const payload = {
    ownerId,
    businessName: ownerName || "আমার বিজনেস",
    dashboardName: ownerName || "আমার বিজনেস",
    logo: null,
    description: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    businessCategory: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload);
  return { id: workspaceId, ...payload };
}

export async function updateWorkspace(workspaceId, patch) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");

  // Never allow changing ownerId
  const clean = { ...patch };
  delete clean.ownerId;
  delete clean.createdAt;

  await updateDoc(doc(db, WORKSPACES, workspaceId), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}