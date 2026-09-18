import { useBranding } from "@/hooks/useBranding";
import { toBanglaDate, toBanglaDateTime } from "@/utils/banglaDate";

/**
 * Universal header for any report, invoice, statement or print view.
 * Automatically pulls the current user's business name + logo.
 *
 * Usage:
 *   <ReportHeader title="স্টক রিপোর্ট" subtitle="সেপ্টেম্বর ২০২৬" />
 *
 *   <ReportHeader
 *     title="ইনভয়েস"
 *     subtitle="#INV-001"
 *     showDateTime
 *   />
 */
export default function ReportHeader({
  title,
  subtitle,
  showDate = true,
  showDateTime = false,
  showContact = true,
  className = "",
  rightExtra = null,
}) {
  const b = useBranding();

  return (
    <div
      className={
        "print-area flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4 " +
        className
      }
    >
      {/* ---------------- Left: logo + name + contact ---------------- */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-line bg-surface-solid">
          {b.logoForPrint ? (
            <img
              src={b.logoForPrint}
              alt={b.businessName}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-lg font-bold text-ink">
              {(b.businessName || "ব").trim().charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-ink">
            {b.businessName}
          </h2>

          {showContact && (
            <div className="mt-0.5 space-y-0.5 text-[11px] text-muted">
              {b.address && <p>{b.address}</p>}
              <p>
                {b.phone ? `📞 ${b.phone}` : ""}
                {b.phone && b.email ? " • " : ""}
                {b.email ? `✉ ${b.email}` : ""}
              </p>
              {b.website && <p>🌐 {b.website}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Right: title + date ---------------- */}
      <div className="text-right">
        {title && (
          <h1 className="text-base font-semibold text-ink sm:text-lg">
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        {showDate && !showDateTime && (
          <p className="mt-1 text-[11px] text-subtle">
            {toBanglaDate(new Date())}
          </p>
        )}
        {showDateTime && (
          <p className="mt-1 text-[11px] text-subtle">
            {toBanglaDateTime(new Date())}
          </p>
        )}
        {rightExtra}
      </div>
    </div>
  );
}