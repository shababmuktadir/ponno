// src/utils/errors.js
const FIREBASE_MESSAGES = {
  "auth/email-already-in-use": "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।",
  "auth/invalid-email": "ইমেইল ঠিকানাটি সঠিক নয়।",
  "auth/weak-password": "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।",
  "auth/user-not-found": "এই তথ্য দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।",
  "auth/wrong-password": "পাসওয়ার্ড সঠিক নয়।",
  "auth/invalid-credential": "ইমেইল বা পাসওয়ার্ড সঠিক নয়।",
  "auth/too-many-requests": "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  "auth/network-request-failed": "নেটওয়ার্ক সংযোগ নেই। ইন্টারনেট পরীক্ষা করুন।",
  "auth/user-disabled": "আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।",
  "auth/requires-recent-login": "নিরাপত্তার জন্য আবার লগইন করুন।",
  "permission-denied": "এই তথ্য ব্যবহারের অনুমতি আপনার নেই।",
  unavailable: "সার্ভারে সংযোগ করা যাচ্ছে না। আবার চেষ্টা করুন।",
  "failed-precondition": "অনুরোধটি সম্পন্ন করা যাচ্ছে না। পেজ রিফ্রেশ করুন।",
  "resource-exhausted": "সাময়িক সীমা অতিক্রম করেছে। কিছুক্ষণ পর চেষ্টা করুন।",
  unauthenticated: "আপনি লগইন করা নেই।",
  "not-found": "অনুরোধকৃত তথ্য পাওয়া যায়নি।",
};

export function getErrorMessage(error, fallback = "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।") {
  if (!error) return fallback;
  const code = error.code || error.message || "";
  if (FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code];
  if (typeof code === "string" && code.startsWith("auth/")) {
    return "লগইন সংক্রান্ত সমস্যা হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।";
  }
  // Log raw error for debugging, but never surface it
  if (import.meta.env.DEV) console.error("[error]", error);
  return fallback;
}