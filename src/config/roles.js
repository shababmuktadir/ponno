export const SUPER_ADMIN_UID = "Dyg7jeBpAfbZsa3ANS9PfIZSsE23";
export const SUPER_ADMIN_EMAIL = "shababmuktadir@gmail.com";

export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  EDITOR: "editor",
  SUPPORT: "support",
  USER: "user",
};

export const STAFF_ROLES = [
  "admin",
  "moderator",
  "editor",
  "support",
];

export const ALL_ROLES = [
  "superAdmin",
  "admin",
  "moderator",
  "editor",
  "support",
  "user",
];

export const ROLE_LABELS = {
  superAdmin: "সুপার অ্যাডমিন",
  admin: "অ্যাডমিন",
  moderator: "মডারেটর",
  editor: "এডিটর",
  support: "সাপোর্ট",
  user: "ইউজার",
};

export const ROLE_DESCRIPTIONS = {
  superAdmin: "সম্পূর্ণ নিয়ন্ত্রণ।",
  admin: "ইউজার, প্যাকেজ, সাবস্ক্রিপশন ব্যবস্থাপনা।",
  moderator: "পেন্ডিং অনুমোদন, ইউজার সাসপেন্ড।",
  editor: "নোটিফিকেশন ও চ্যাট ব্যবস্থাপনা।",
  support: "ইউজার দেখা ও চ্যাট সাপোর্ট।",
};

export const PERMISSIONS = {
  superAdmin: ["*"],
  admin: [
    "dashboard.view",
    "users.view", "users.edit", "users.approve", "users.suspend", "users.data.view",
    "packages.view", "packages.manage",
    "subscriptions.view", "subscriptions.manage",
    "earnings.view",
    "usage.view",
    "notifications.view", "notifications.manage",
    "chat.view", "chat.reply",
    "reports.view", "reports.export",
    "audit.view",
    "settings.view",
  ],
  moderator: [
    "dashboard.view",
    "users.view", "users.approve", "users.suspend", "users.data.view",
    "packages.view",
    "subscriptions.view",
    "earnings.view",
    "usage.view",
    "notifications.view",
    "chat.view", "chat.reply",
    "reports.view",
  ],
  editor: [
    "dashboard.view",
    "users.view",
    "packages.view",
    "notifications.view", "notifications.manage",
    "chat.view", "chat.reply",
    "reports.view", "reports.export",
  ],
  support: [
    "dashboard.view",
    "users.view",
    "chat.view", "chat.reply",
    "reports.view",
  ],
  user: [],
};

export function hasPermission(role, permission) {
  if (!role) return false;
  const perms = PERMISSIONS[role] || [];
  if (perms.indexOf("*") !== -1) return true;
  return perms.indexOf(permission) !== -1;
}

export function isStaffRole(role) {
  if (!role) return false;
  return (
    role === "superAdmin" ||
    role === "admin" ||
    role === "moderator" ||
    role === "editor" ||
    role === "support"
  );
}