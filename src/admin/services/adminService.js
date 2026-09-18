import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, limit, serverTimestamp, addDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";

const USERS = "users";
const PACKAGES = "packages";
const SUBSCRIPTIONS = "subscriptions";
const AUDIT = "auditLogs";
const NOTIFS = "notifications";
const SUPPORT_CHATS = "supportChats";
const USAGE = "usage";

const STAFF = ["admin", "moderator", "editor", "support"];
const SUPER_UID = "IfTBq2rSXWIk6ZdcKol9fUZH7r1";

export async function writeAudit(actor, action, meta) {
  try {
    await addDoc(collection(db, AUDIT), {
      actorId: (actor && actor.uid) || null,
      actorName: (actor && actor.name) || "",
      actorRole: (actor && actor.role) || "unknown",
      action: action,
      meta: meta || {},
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error("[audit]", err);
  }
}

export async function listUsers(options) {
  const max = (options && options.max) || 500;
  const snap = await getDocs(query(collection(db, USERS), limit(max)));
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function listUsersByStatus(status, max) {
  const m = max || 500;
  const snap = await getDocs(
    query(collection(db, USERS), where("accountStatus", "==", status), limit(m))
  );
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? Object.assign({ id: snap.id }, snap.data()) : null;
}

export async function updateUser(uid, patch, actor) {
  await updateDoc(doc(db, USERS, uid), Object.assign({}, patch, { updatedAt: serverTimestamp() }));
  await writeAudit(actor, "user.updated", { targetUid: uid });
}

export async function approvePaidUser(uid, actor) {
  await updateDoc(doc(db, USERS, uid), {
    accountStatus: "active",
    accountType: "paid",
    temporaryAccess: null,
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "user.approved.paid", { targetUid: uid });
}

export async function rejectPaidUser(uid, actor) {
  await updateDoc(doc(db, USERS, uid), {
    accountStatus: "active",
    accountType: "free",
    packageId: "free",
    temporaryAccess: null,
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "user.rejected.paid", { targetUid: uid });
}

export async function suspendUser(uid, actor) {
  await updateDoc(doc(db, USERS, uid), {
    accountStatus: "suspended",
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "user.suspended", { targetUid: uid });
}

export async function reactivateUser(uid, actor) {
  await updateDoc(doc(db, USERS, uid), {
    accountStatus: "active",
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "user.reactivated", { targetUid: uid });
}

export async function assignPackageToUser(uid, packageId, durationDays, actor) {
  const now = new Date();
  const days = Number(durationDays) || 30;
  const expiresAt = new Date(now.getTime() + days * 86400000);

  await updateDoc(doc(db, USERS, uid), {
    packageId: packageId,
    subscriptionStatus: "active",
    accountStatus: "active",
    subscriptionStart: now.toISOString(),
    subscriptionExpiry: expiresAt.toISOString(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, SUBSCRIPTIONS), {
    userId: uid,
    packageId: packageId,
    status: "active",
    startDate: now.toISOString(),
    expiryDate: expiresAt.toISOString(),
    createdBy: (actor && actor.uid) || null,
    createdAt: serverTimestamp(),
  });

  await writeAudit(actor, "user.package.assigned", { targetUid: uid, packageId: packageId });
}

export async function listStaff(max) {
  const m = max || 200;
  const snap = await getDocs(query(collection(db, USERS), limit(1000)));
  const list = snap.docs
    .map((d) => Object.assign({ id: d.id }, d.data()))
    .filter((u) => STAFF.indexOf(u.role) !== -1 || u.id === SUPER_UID);

  return list;
}

export async function createStaff(data, actor) {
  if (STAFF.indexOf(data.role) === -1) throw new Error("অবৈধ রোল।");
  if (data.uid === SUPER_UID) throw new Error("সুপার অ্যাডমিন পরিবর্তন করা যাবে না।");

  await setDoc(
    doc(db, USERS, data.uid),
    {
      uid: data.uid,
      email: (data.email || "").toLowerCase(),
      name: data.name || "স্টাফ",
      role: data.role,
      accountStatus: "active",
      accountType: "staff",
      packageId: "staff",
      subscriptionStatus: "active",
      createdBy: (actor && actor.uid) || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await writeAudit(actor, "staff.created", { targetUid: data.uid, role: data.role });
}

export async function promoteToStaff(uid, role, actor) {
  if (uid === SUPER_UID) throw new Error("সুপার অ্যাডমিন পরিবর্তন করা যাবে না।");
  if (STAFF.indexOf(role) === -1) throw new Error("অবৈধ রোল।");

  await updateDoc(doc(db, USERS, uid), {
    role: role,
    accountType: "staff",
    accountStatus: "active",
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "staff.promoted", { targetUid: uid, role: role });
}

export async function demoteStaff(uid, actor) {
  if (uid === SUPER_UID) throw new Error("সুপার অ্যাডমিন পরিবর্তন করা যাবে না।");

  await updateDoc(doc(db, USERS, uid), {
    role: "user",
    accountType: "free",
    packageId: "free",
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "staff.demoted", { targetUid: uid });
}

export async function listPackages(max) {
  const m = max || 200;
  const snap = await getDocs(query(collection(db, PACKAGES), limit(m)));
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function getPackage(id) {
  const snap = await getDoc(doc(db, PACKAGES, id));
  return snap.exists() ? Object.assign({ id: snap.id }, snap.data()) : null;
}

export async function createPackage(data, actor) {
  const ref = await addDoc(collection(db, PACKAGES), Object.assign({}, data, {
    status: data.status || "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  await writeAudit(actor, "package.created", { packageId: ref.id, name: data.name });
  return ref.id;
}

export async function updatePackage(id, patch, actor) {
  await updateDoc(doc(db, PACKAGES, id), Object.assign({}, patch, { updatedAt: serverTimestamp() }));
  await writeAudit(actor, "package.updated", { packageId: id });
}

export async function deletePackage(id, actor) {
  await deleteDoc(doc(db, PACKAGES, id));
  await writeAudit(actor, "package.deleted", { packageId: id });
}

export async function listSubscriptions(max) {
  const m = max || 500;
  const snap = await getDocs(query(collection(db, SUBSCRIPTIONS), limit(m)));
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function cancelSubscription(id, actor) {
  await updateDoc(doc(db, SUBSCRIPTIONS, id), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });
  await writeAudit(actor, "subscription.cancelled", { subscriptionId: id });
}

export async function listUsage(max) {
  const m = max || 500;
  const snap = await getDocs(query(collection(db, USAGE), limit(m)));
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function listNotifications(max) {
  const m = max || 100;
  const snap = await getDocs(query(collection(db, NOTIFS), limit(m)));
  const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  list.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return list;
}

export async function createNotification(data, actor) {
  const ref = await addDoc(collection(db, NOTIFS), Object.assign({}, data, {
    createdBy: (actor && actor.uid) || null,
    createdByName: (actor && actor.name) || "",
    createdAt: serverTimestamp(),
  }));
  await writeAudit(actor, "notification.created", { notificationId: ref.id });
  return ref.id;
}

export async function deleteNotification(id, actor) {
  await deleteDoc(doc(db, NOTIFS, id));
  await writeAudit(actor, "notification.deleted", { notificationId: id });
}

export async function listSupportChats(max) {
  const m = max || 100;
  const snap = await getDocs(query(collection(db, SUPPORT_CHATS), limit(m)));
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function listAuditLogs(max) {
  const m = max || 300;
  const snap = await getDocs(query(collection(db, AUDIT), limit(m)));
  const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  list.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return list;
}

export async function getDashboardStats() {
  const [usersSnap, subsSnap, pkgSnap, notifsSnap] = await Promise.all([
    getDocs(query(collection(db, USERS), limit(1000))),
    getDocs(query(collection(db, SUBSCRIPTIONS), limit(1000))),
    getDocs(query(collection(db, PACKAGES), limit(500))),
    getDocs(query(collection(db, NOTIFS), limit(500))),
  ]);

  const users = usersSnap.docs.map((d) => d.data());
  const subs = subsSnap.docs.map((d) => d.data());

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const getAmt = (s) => Number(s.price) || Number(s.amountPaid) || 0;
  const getTime = (s) => (s.createdAt && s.createdAt.seconds ? s.createdAt.seconds * 1000 : 0);

  let totalRevenue = 0;
  let monthRevenue = 0;
  subs.forEach((s) => {
    const a = getAmt(s);
    totalRevenue += a;
    if (getTime(s) >= monthStart.getTime()) monthRevenue += a;
  });

  return {
    totalUsers: users.length,
    freeUsers: users.filter((u) => u.accountType === "free").length,
    paidUsers: users.filter((u) => u.accountType === "paid").length,
    staffUsers: users.filter((u) => STAFF.indexOf(u.role) !== -1).length,
    pending: users.filter((u) => u.accountStatus === "pending").length,
    suspended: users.filter((u) => u.accountStatus === "suspended").length,
    activeSubs: subs.filter((s) => s.status === "active").length,
    expiredSubs: subs.filter((s) => s.status === "expired").length,
    totalPackages: pkgSnap.size,
    totalNotifications: notifsSnap.size,
    totalRevenue: totalRevenue,
    monthRevenue: monthRevenue,
  };
}

export async function getUserWorkspaceData(workspaceId) {
  const empty = { products: [], categories: [], customers: [], invoices: [], stockTx: [] };
  if (!workspaceId) return empty;

  const [products, categories, customers, invoices, stockTx] = await Promise.all([
    getDocs(query(collection(db, "workspaces", workspaceId, "products"), limit(500))),
    getDocs(query(collection(db, "workspaces", workspaceId, "categories"), limit(500))),
    getDocs(query(collection(db, "workspaces", workspaceId, "customers"), limit(500))),
    getDocs(query(collection(db, "workspaces", workspaceId, "invoices"), limit(500))),
    getDocs(query(collection(db, "workspaces", workspaceId, "stockTransactions"), limit(500))),
  ]);

  const map = (s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data()));

  return {
    products: map(products),
    categories: map(categories),
    customers: map(customers),
    invoices: map(invoices),
    stockTx: map(stockTx),
  };
}