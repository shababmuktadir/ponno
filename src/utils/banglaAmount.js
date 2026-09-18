// src/utils/banglaAmount.js
import { toBanglaNumber } from "./banglaNumber";

/** 0–99 lookup — Bengali numerals are irregular, so a table is the only correct way. */
const BN_0_99 = [
  "শূন্য","এক","দুই","তিন","চার","পাঁচ","ছয়","সাত","আট","নয়",
  "দশ","এগারো","বারো","তেরো","চৌদ্দ","পনেরো","ষোলো","সতেরো","আঠারো","উনিশ",
  "বিশ","একুশ","বাইশ","তেইশ","চব্বিশ","পঁচিশ","ছাব্বিশ","সাতাশ","আটাশ","ঊনত্রিশ",
  "ত্রিশ","একত্রিশ","বত্রিশ","তেত্রিশ","চৌত্রিশ","পঁয়ত্রিশ","ছত্রিশ","সাঁইত্রিশ","আটত্রিশ","ঊনচল্লিশ",
  "চল্লিশ","একচল্লিশ","বিয়াল্লিশ","তেতাল্লিশ","চুয়াল্লিশ","পঁয়তাল্লিশ","ছেচল্লিশ","সাতচল্লিশ","আটচল্লিশ","ঊনপঞ্চাশ",
  "পঞ্চাশ","একান্ন","বাহান্ন","তিপ্পান্ন","চুয়ান্ন","পঞ্চান্ন","ছাপ্পান্ন","সাতান্ন","আটান্ন","ঊনষাট",
  "ষাট","একষট্টি","বাষট্টি","তেষট্টি","চৌষট্টি","পঁয়ষট্টি","ছেষট্টি","সাতষট্টি","আটষট্টি","ঊনসত্তর",
  "সত্তর","একাত্তর","বাহাত্তর","তিয়াত্তর","চুয়াত্তর","পঁচাত্তর","ছিয়াত্তর","সাতাত্তর","আটাত্তর","ঊনআশি",
  "আশি","একাশি","বিরাশি","তিরাশি","চুরাশি","পঁচাশি","ছিয়াশি","সাতাশি","আটাশি","ঊননব্বই",
  "নব্বই","একানব্বই","বিরানব্বই","তিরানব্বই","চুরানব্বই","পঁচানব্বই","ছিয়ানব্বই","সাতানব্বই","আটানব্বই","নিরানব্বই",
];

function under1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h) parts.push(BN_0_99[h] + "শ");
  if (r) parts.push(BN_0_99[r]);
  return parts.join(" ");
}

/** Indian numbering: কোটি / লক্ষ / হাজার / শত */
export function numberToBengaliWords(value) {
  const num = Math.floor(Math.abs(Number(value) || 0));
  if (num === 0) return BN_0_99[0];

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  const parts = [];
  if (crore) parts.push(`${under1000(crore)} কোটি`);
  if (lakh) parts.push(`${under1000(lakh)} লক্ষ`);
  if (thousand) parts.push(`${under1000(thousand)} হাজার`);
  if (rest) parts.push(under1000(rest));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** দুই হাজার পাঁচশত টাকা মাত্র */
export function amountInBengaliWords(amount, { paisa = false } = {}) {
  const n = Number(amount) || 0;
  const whole = Math.floor(Math.abs(n));
  const fraction = Math.round((Math.abs(n) - whole) * 100);

  let out = numberToBengaliWords(whole) + " টাকা";
  if (paisa && fraction > 0) {
    out += " " + numberToBengaliWords(fraction) + " পয়সা";
  }
  return out + " মাত্র";
}

/** Full invoice line: "মোট: ৳ ২,৫০০ — কথায়: দুই হাজার পাঁচশত টাকা মাত্র" */
export function bengaliAmountPair(amount) {
  const n = Number(amount) || 0;
  return {
    display: `৳ ${toBanglaNumber(
      n.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    )}`,
    words: amountInBengaliWords(n),
  };
}