/**
 * Pricing math helpers
 * All yearly/5-year calculations happen here — NEVER stored as truth in DB,
 * always derived from monthlyPrice + discount%.
 */

export const BILLING_PERIODS = [
  { id: "monthly", label: "মাসিক",  short: "মাস",   months: 1 },
  { id: "yearly",  label: "বার্ষিক", short: "বছর",  months: 12 },
  { id: "fiveYear", label: "৫ বছর",  short: "৫ বছর", months: 60 },
];

/* ---------- Math ---------- */

export function roundTaka(n) {
  return Math.max(0, Math.round(Number(n) || 0));
}

export function calcYearly(monthlyPrice, yearlyDiscountPct) {
  const monthly = Number(monthlyPrice) || 0;
  const pct = Math.min(100, Math.max(0, Number(yearlyDiscountPct) || 0));
  const base = monthly * 12;
  const discountAmount = roundTaka((base * pct) / 100);
  const final = roundTaka(base - discountAmount);
  return { base, discountAmount, final, discountPct: pct };
}

export function calcFiveYear(monthlyPrice, fiveYearDiscountPct) {
  const monthly = Number(monthlyPrice) || 0;
  const pct = Math.min(100, Math.max(0, Number(fiveYearDiscountPct) || 0));
  const base = monthly * 60;
  const discountAmount = roundTaka((base * pct) / 100);
  const final = roundTaka(base - discountAmount);
  return { base, discountAmount, final, discountPct: pct };
}

/**
 * একটি package এর সব pricing calculate করে
 * Returns {
 *   monthly: { final, base, discountAmount, discountPct },
 *   yearly:  { final, base, discountAmount, discountPct, monthlyEquivalent },
 *   fiveYear:{ final, base, discountAmount, discountPct, monthlyEquivalent },
 * }
 */
export function calcAllPrices(pkg, globalSettings = {}) {
  const monthly = Number(pkg?.monthlyPrice) || 0;
  const yearlyPct =
    Number(pkg?.yearlyDiscount) ??
    Number(globalSettings?.yearlyDiscount) ??
    15;
  const fiveYearPct =
    Number(pkg?.fiveYearDiscount) ??
    Number(globalSettings?.fiveYearDiscount) ??
    30;

  const yearly = calcYearly(monthly, yearlyPct);
  const fiveYear = calcFiveYear(monthly, fiveYearPct);

  return {
    monthly: {
      base: monthly,
      final: monthly,
      discountAmount: 0,
      discountPct: 0,
      monthlyEquivalent: monthly,
    },
    yearly: {
      ...yearly,
      monthlyEquivalent: roundTaka(yearly.final / 12),
    },
    fiveYear: {
      ...fiveYear,
      monthlyEquivalent: roundTaka(fiveYear.final / 60),
    },
  };
}

/* ---------- Formatting ---------- */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBn(n) {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatBDT(amount, symbol = "৳") {
  const n = Number(amount) || 0;
  const formatted = n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return `${symbol} ${toBn(formatted)}`;
}

/**
 * "৳ 6,630 / বছর"  বা  "৳ 27,300 / ৫ বছর"
 */
export function formatPerPeriod(amount, periodId, symbol = "৳") {
  const p = BILLING_PERIODS.find((x) => x.id === periodId);
  const suffix = p ? (periodId === "monthly" ? "/মাস" : `/ ${p.label}`) : "";
  return `${formatBDT(amount, symbol)} ${suffix}`;
}

/**
 * Display savings text
 */
export function savingsText(discountPct, discountAmount, symbol = "৳") {
  if (discountPct <= 0) return "";
  return `সেভ ${toBn(discountPct)}% (${formatBDT(discountAmount, symbol)})`;
}

/**
 * Discount percentage badge
 */
export function discountBadge(discountPct) {
  if (discountPct <= 0) return "";
  return `${toBn(discountPct)}% ছাড়`;
}