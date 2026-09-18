// src/utils/banglaNumber.js
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function toEnglishDigits(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[০-৯]/g, (ch) => String(BN_DIGITS.indexOf(ch)));
}

/** ৳ ২,৫০০ */
export function formatTaka(amount, { withSymbol = true } = {}) {
  const n = Number(amount) || 0;
  const formatted = n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const bn = toBanglaNumber(formatted);
  return withSymbol ? `৳ ${bn}` : bn;
}

export const toBn = toBanglaNumber;