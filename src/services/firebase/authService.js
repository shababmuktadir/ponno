import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";

export const USERS = "users";

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function fetchUserDoc(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Self-heal: auth ইউজার থাকলেও users doc না থাকলে default doc বানায়।
 * এতে "প্রোফাইল লোড হচ্ছে..." এ আটকে থাকা বন্ধ হয়।
 */
export async function ensureUserDoc(firebaseUser) {
  if (!firebaseUser) return null;
  const existing = await fetchUserDoc(firebaseUser.uid);
  if (existing) return existing;

  const workspaceId = crypto.randomUUID();
  const payload = {
    uid: firebaseUser.uid,
    email: (firebaseUser.email || "").toLowerCase(),
    name: firebaseUser.displayName || "ব্যবহারকারী",
    phone: "",
    nid: "",
    role: "user",
    accountType: "free",
    accountStatus: "active",
    packageId: "free",
    subscriptionStatus: "active",
    temporaryAccess: null,
    emailVerified: Boolean(firebaseUser.emailVerified),
    workspaceId,
    businessName: firebaseUser.displayName || "আমার বিজনেস",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, USERS, firebaseUser.uid), payload);
    return { id: firebaseUser.uid, ...payload };
  } catch (err) {
    if (import.meta.env.DEV) console.error("[ensureUserDoc]", err);
    return null;
  }
}

export async function signupUser({
  name, email, password, phone, nid,
  accountType = "free",
  workspaceId,
}) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;

  await updateProfile(cred.user, { displayName: name });

  const isPaidRequest = accountType === "paid";

  await setDoc(doc(db, USERS, uid), {
    uid,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    phone: phone?.trim() || "",
    nid: nid?.trim() || "",
    role: "user",
    accountType: isPaidRequest ? "paid" : "free",
    accountStatus: isPaidRequest ? "pending" : "active",
    packageId: "free",
    subscriptionStatus: "active",
    temporaryAccess: isPaidRequest ? "free" : null,
    emailVerified: false,
    workspaceId,
    businessName: name.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await sendEmailVerification(cred.user).catch(() => {});
  return cred.user;
}

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logoutUser() {
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerification() {
  if (!auth.currentUser) throw new Error("লগইন করা নেই।");
  return sendEmailVerification(auth.currentUser);
}