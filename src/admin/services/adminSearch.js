import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/config/firebase";

let cache = null;
let pending = null;

export async function getSearchIndex(force = false) {
  if (!force && cache) return cache;
  if (!force && pending) return pending;

  pending = (async () => {
    const [users, packages, subs, notifs, audits] = await Promise.all([
      getDocs(query(collection(db, "users"), limit(1000))),
      getDocs(query(collection(db, "packages"), limit(300))),
      getDocs(query(collection(db, "subscriptions"), limit(800))),
      getDocs(query(collection(db, "notifications"), limit(300))),
      getDocs(query(collection(db, "auditLogs"), limit(500))),
    ]);

    const map = (snap) =>
      snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    cache = {
      users: map(users),
      packages: map(packages),
      subscriptions: map(subs),
      notifications: map(notifs),
      auditLogs: map(audits),
      builtAt: Date.now(),
    };
    pending = null;
    return cache;
  })();

  return pending;
}

export function clearSearchCache() {
  cache = null;
  pending = null;
}

const norm = (v) => String(v || "").toLowerCase().trim();

export function searchAll(index, queryText) {
  const q = norm(queryText);
  if (!q || !index) return [];

  const results = [];

  // ---- Users ----
  for (const u of index.users) {
    const hay = [
      u.name, u.email, u.phone, u.id, u.workspaceId, u.role,
      u.accountType, u.accountStatus, u.nid, u.packageId,
    ].map(norm).join(" ");
    if (hay.includes(q)) {
      results.push({
        kind: "user",
        id: u.id,
        title: u.name || u.email || "ইউজার",
        subtitle: u.email || "",
        meta: `UID: ${u.id}`,
        badge: u.role || "user",
        status: u.accountStatus,
        to: `/admin/users/${u.id}`,
        raw: u,
      });
    }
    if (results.length > 60) break;
  }

  // ---- Packages ----
  for (const p of index.packages) {
    const hay = [p.name, p.id, p.price, p.durationDays].map(norm).join(" ");
    if (hay.includes(q)) {
      results.push({
        kind: "package",
        id: p.id,
        title: p.name || "প্যাকেজ",
        subtitle: `৳ ${p.price || 0} • ${p.durationDays || 0} দিন`,
        meta: `ID: ${p.id}`,
        badge: "package",
        to: "/admin/packages",
        raw: p,
      });
    }
  }

  // ---- Subscriptions ----
  for (const s of index.subscriptions) {
    const hay = [s.userId, s.packageId, s.status, s.id].map(norm).join(" ");
    if (hay.includes(q)) {
      results.push({
        kind: "subscription",
        id: s.id,
        title: `সাবস্ক্রিপশন • ${s.packageId || "—"}`,
        subtitle: `ইউজার: ${s.userId || "—"}`,
        meta: `স্ট্যাটাস: ${s.status || "—"}`,
        badge: "subscription",
        to: "/admin/subscriptions",
        raw: s,
      });
      if (results.length > 90) break;
    }
  }

  // ---- Notifications ----
  for (const n of index.notifications) {
    const hay = [n.title, n.message, n.target, n.priority].map(norm).join(" ");
    if (hay.includes(q)) {
      results.push({
        kind: "notification",
        id: n.id,
        title: n.title || "নোটিফিকেশন",
        subtitle: n.message || "",
        meta: `টার্গেট: ${n.target || "all"}`,
        badge: "notification",
        to: "/admin/notifications",
        raw: n,
      });
    }
  }

  // ---- Audit logs ----
  for (const a of index.auditLogs) {
    const hay = [a.action, a.actorName, a.actorId, a.actorRole].map(norm).join(" ");
    if (hay.includes(q)) {
      results.push({
        kind: "audit",
        id: a.id,
        title: a.action || "অ্যাকশন",
        subtitle: a.actorName || a.actorId || "",
        meta: `রোল: ${a.actorRole || "—"}`,
        badge: "audit",
        to: "/admin/audit",
        raw: a,
      });
      if (results.length > 120) break;
    }
  }

  return results.slice(0, 40);
}