// src/utils/banglaDate.js
import { toBanglaNumber } from "./banglaNumber";

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

const BN_DAYS = [
  "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার",
  "বৃহস্পতিবার", "শুক্রবার", "শনিবার",
];

function asDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate(); // Firestore Timestamp
  if (typeof value === "object" && typeof value.seconds === "number")
    return new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ১৭ সেপ্টেম্বর ২০২৬ */
export function toBanglaDate(value) {
  const d = asDate(value);
  if (!d) return "";
  return `${toBanglaNumber(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBanglaNumber(
    d.getFullYear()
  )}`;
}

/** ১৭ সেপ্টেম্বর ২০২৬, ৩:৪৫ PM */
export function toBanglaDateTime(value) {
  const d = asDate(value);
  if (!d) return "";
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${toBanglaNumber(h)}:${toBanglaNumber(
    String(d.getMinutes()).padStart(2, "0")
  )} ${ampm}`;
  return `${toBanglaDate(d)}, ${time}`;
}

export function toBanglaDay(value) {
  const d = asDate(value);
  return d ? BN_DAYS[d.getDay()] : "";
}

export const BN_MONTH_NAMES = BN_MONTHS;
export const BN_DAY_NAMES = BN_DAYS;
export { asDate };