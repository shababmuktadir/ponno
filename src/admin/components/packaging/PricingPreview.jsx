import { TrendingDown, Calendar, Clock } from "lucide-react";
import { calcAllPrices, formatBDT, toBn } from "@/config/pricing";

/**
 * Displays monthly / yearly / 5-year prices with discounts.
 *
 * Usage:
 *   <PricingPreview monthlyPrice={650} yearlyDiscount={15} fiveYearDiscount={30} />
 */
export default function PricingPreview({
  monthlyPrice,
  yearlyDiscount,
  fiveYearDiscount,
  symbol = "৳",
}) {
  const prices = calcAllPrices(
    { monthlyPrice, yearlyDiscount, fiveYearDiscount },
    { yearlyDiscount, fiveYearDiscount }
  );

  const cards = [
    {
      id: "monthly",
      icon: Calendar,
      label: "মাসিক",
      per: "প্রতি মাস",
      price: prices.monthly.final,
      base: null,
      discountPct: 0,
      discountAmount: 0,
    },
    {
      id: "yearly",
      icon: TrendingDown,
      label: "বার্ষিক",
      per: "প্রতি বছর",
      price: prices.yearly.final,
      base: prices.yearly.base,
      discountPct: prices.yearly.discountPct,
      discountAmount: prices.yearly.discountAmount,
    },
    {
      id: "fiveYear",
      icon: Clock,
      label: "৫ বছর",
      per: "৫ বছরের জন্য",
      price: prices.fiveYear.final,
      base: prices.fiveYear.base,
      discountPct: prices.fiveYear.discountPct,
      discountAmount: prices.fiveYear.discountAmount,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="label-xs">স্বয়ংক্রিয়ভাবে হিসাব করা মূল্য</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const hasDiscount = c.discountPct > 0 && c.discountAmount > 0;
          return (
            <div
              key={c.id}
              className="rounded-[14px] border border-line bg-surface/50 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-surface-2 text-ink">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs font-semibold text-ink">{c.label}</p>
                {hasDiscount && (
                  <span className="ml-auto rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                    {toBn(c.discountPct)}% ছাড়
                  </span>
                )}
              </div>

              <p className="mt-3 text-xl font-semibold text-ink">
                {formatBDT(c.price, symbol)}
              </p>
              <p className="text-[11px] text-muted">{c.per}</p>

              {hasDiscount && (
                <div className="mt-2 space-y-0.5 border-t border-line pt-2 text-[11px]">
                  <p className="text-muted line-through">
                    মূল: {formatBDT(c.base, symbol)}
                  </p>
                  <p className="text-success">
                    সেভ: {formatBDT(c.discountAmount, symbol)}
                  </p>
                </div>
              )}

              {c.id !== "monthly" && !hasDiscount && (
                <p className="mt-2 border-t border-line pt-2 text-[11px] text-subtle">
                  ছাড় নেই
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}