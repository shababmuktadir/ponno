import {
  addDoc, collection, deleteDoc, doc, getDocs, limit as qLimit,
  query, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { incrementUsage, setUsageValue } from "./usageService";

const WS = "workspaces";

function col(workspaceId) {
  return collection(db, WS, workspaceId, "smsHistory");
}

/* ---------- LIST ---------- */

export async function listSmsHistory(workspaceId, { max = 500 } = {}) {
  if (!workspaceId) return [];
  const snap = await getDocs(col(workspaceId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.sentAt?.seconds || 0) - (a.sentAt?.seconds || 0))
    .slice(0, max);
}

/* ---------- LOG SMS ---------- */

export async function logSms(workspaceId, payload, actor) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");

  const ref = await addDoc(col(workspaceId), {
    workspaceId,
    phone: String(payload.phone || ""),
    message: String(payload.message || ""),
    customerId: payload.customerId || null,
    customerName: payload.customerName || "",
    status: payload.status || "sent",
    provider: payload.provider || "bulksmsbd",
    messageId: payload.messageId || null,
    errorMessage: payload.errorMessage || null,
    sentAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });

  // Update usage counter
  try {
    await incrementUsage(workspaceId, "sms", 1);
  } catch (err) {
    if (import.meta.env.DEV) console.error("[sms usage inc]", err);
  }

  return ref.id;
}

/* ---------- DELETE ---------- */

export async function deleteSms(workspaceId, id) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  await deleteDoc(doc(db, WS, workspaceId, "smsHistory", id));
}

/* ---------- RECOUNT ---------- */

export async function recountSms(workspaceId) {
  if (!workspaceId) return 0;
  const snap = await getDocs(col(workspaceId));
  await setUsageValue(workspaceId, "sms", snap.size);
  return snap.size;
}

/* ---------- TEMPLATES (optional) ---------- */

const TEMPLATES_COL = (workspaceId) =>
  collection(db, WS, workspaceId, "smsTemplates");

export async function listSmsTemplates(workspaceId) {
  if (!workspaceId) return [];
  const snap = await getDocs(TEMPLATES_COL(workspaceId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveSmsTemplate(workspaceId, { name, body }, actor) {
  if (!workspaceId) throw new Error("ওয়ার্কস্পেস নেই");
  const ref = await addDoc(TEMPLATES_COL(workspaceId), {
    name: String(name || "").trim(),
    body: String(body || ""),
    createdAt: serverTimestamp(),
    createdBy: actor?.uid || null,
  });
  return ref.id;
}

export async function deleteSmsTemplate(workspaceId, id) {
  if (!workspaceId || !id) throw new Error("id প্রয়োজন");
  await deleteDoc(doc(db, WS, workspaceId, "smsTemplates", id));
}