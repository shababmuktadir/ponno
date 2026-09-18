import { forwardRef } from "react";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";
import { amountInBengaliWords } from "@/utils/banglaAmount";

/**
 * A4-sized invoice template.
 * Edit styles here to change invoice appearance globally.
 */
const InvoiceTemplate = forwardRef(function InvoiceTemplate(
  { invoice, branding },
  ref
) {
  if (!invoice) return null;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal) || 0;
  const discount = Number(invoice.discountAmount) || 0;
  const taxAmount = Number(invoice.taxAmount) || 0;
  const grandTotal = Number(invoice.grandTotal) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const due = Math.max(0, grandTotal - paid);

  const paymentStatus = invoice.paymentStatus || "unpaid";

  return (
    <div
      ref={ref}
      className="invoice-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm",
        background: "#ffffff",
        color: "#000000",
        fontFamily: "'Kalpurush', 'Noto Sans Bengali', sans-serif",
        fontSize: "13px",
        lineHeight: 1.5,
        position: "relative",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* WATERMARK */}
      {paymentStatus === "paid" && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            fontSize: "120px",
            fontWeight: 700,
            color: "rgba(34, 197, 94, 0.12)",
            letterSpacing: "12px",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
          }}
        >
          PAID
        </div>
      )}
      {paymentStatus === "partial" && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            fontSize: "100px",
            fontWeight: 700,
            color: "rgba(245, 158, 11, 0.12)",
            letterSpacing: "8px",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
          }}
        >
          PARTIAL
        </div>
      )}

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          borderBottom: "2px solid #0B0B0C",
          paddingBottom: "14px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {branding?.logo ? (
              <img
                src={branding.logo}
                alt="logo"
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: "24px", fontWeight: 700 }}>
                {(branding?.businessName || "ব").charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
              {branding?.businessName || "আমার ব্যবসা"}
            </h1>
            {branding?.address && (
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#444" }}>
                {branding.address}
              </p>
            )}
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#444" }}>
              {branding?.phone && `📞 ${branding.phone}`}
              {branding?.phone && branding?.email && " • "}
              {branding?.email && `✉ ${branding.email}`}
            </p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            ইনভয়েস
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
            <b>#{invoice.invoiceNumber}</b>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#444" }}>
            তারিখ: {toBanglaDate(invoice.date)}
          </p>
        </div>
      </div>

      {/* CUSTOMER */}
      <div
        style={{
          marginTop: "14px",
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "#f7f7f7",
            padding: "10px 14px",
            borderRadius: "8px",
            flex: 1,
            maxWidth: "55%",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            বিল প্রাপক
          </p>
          <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "14px" }}>
            {invoice.customerName || "সাধারণ ক্রেতা"}
          </p>
          {invoice.customerPhone && (
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#333" }}>
              📞 {invoice.customerPhone}
            </p>
          )}
          {invoice.customerEmail && (
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#333" }}>
              ✉ {invoice.customerEmail}
            </p>
          )}
          {invoice.customerAddress && (
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#333" }}>
              📍 {invoice.customerAddress}
            </p>
          )}
        </div>

        <div
          style={{
            background: "#f7f7f7",
            padding: "10px 14px",
            borderRadius: "8px",
            minWidth: "35%",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            পেমেন্ট স্ট্যাটাস
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontWeight: 700,
              fontSize: "14px",
              color:
                paymentStatus === "paid"
                  ? "#16a34a"
                  : paymentStatus === "partial"
                  ? "#d97706"
                  : "#dc2626",
            }}
          >
            {paymentStatus === "paid"
              ? "পরিশোধিত"
              : paymentStatus === "partial"
              ? "আংশিক পরিশোধিত"
              : "বাকি"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#333" }}>
            পরিশোধ: {formatTaka(paid)}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#333" }}>
            বাকি: {formatTaka(due)}
          </p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "18px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <thead>
          <tr style={{ background: "#0B0B0C", color: "#fff" }}>
            <th style={thStyle}>ক্রম</th>
            <th style={thStyle}>প্রোডাক্ট</th>
            <th style={thStyle}>মডেল</th>
            <th style={thStyle}>পরিমাণ</th>
            <th style={thStyle}>ইউনিট দর</th>
            <th style={thStyle}>মোট</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr
              key={i}
              style={{
                borderBottom: "1px solid #e5e5e5",
                background: i % 2 === 0 ? "#fafafa" : "#fff",
              }}
            >
              <td style={tdStyleCenter}>{toBanglaNumber(i + 1)}</td>
              <td style={tdStyle}>{it.productName || "—"}</td>
              <td style={tdStyle}>{it.productModel || "—"}</td>
              <td style={tdStyleCenter}>{toBanglaNumber(it.quantity || 0)}</td>
              <td style={tdStyleRight}>{formatTaka(it.unitPrice || 0)}</td>
              <td style={tdStyleRight}>{formatTaka(it.total || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "flex-end",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ width: "60%", minWidth: "260px" }}>
          <Row label="সাবটোটাল" value={formatTaka(subtotal)} />
          {discount > 0 && (
            <Row label="ডিসকাউন্ট" value={`− ${formatTaka(discount)}`} />
          )}
          {taxAmount > 0 && (
            <Row
              label={`ট্যাক্স (${toBanglaNumber(invoice.taxPct || 0)}%)`}
              value={formatTaka(taxAmount)}
            />
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "#0B0B0C",
              color: "#fff",
              borderRadius: "6px",
              marginTop: "6px",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            <span>সর্বমোট</span>
            <span>{formatTaka(grandTotal)}</span>
          </div>

          <p
            style={{
              marginTop: "6px",
              fontSize: "12px",
              color: "#333",
              textAlign: "right",
              fontStyle: "italic",
            }}
          >
            কথায়: {amountInBengaliWords(grandTotal)}
          </p>
        </div>
      </div>

      {/* NOTE */}
      {invoice.note && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 12px",
            border: "1px dashed #ccc",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#333",
            position: "relative",
            zIndex: 1,
          }}
        >
          <b>নোট:</b> {invoice.note}
        </div>
      )}

      {/* FOOTER */}
      <div
        style={{
          marginTop: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: "11px", color: "#666" }}>
          <p style={{ margin: 0 }}>
            এই ইনভয়েস কম্পিউটার জেনারেটেড। স্বাক্ষরের প্রয়োজন নেই।
          </p>
          <p style={{ margin: "2px 0 0" }}>
            {branding?.website || ""}
          </p>
        </div>
        <div
          style={{
            borderTop: "1px solid #000",
            paddingTop: "4px",
            minWidth: "180px",
            textAlign: "center",
            fontSize: "11px",
          }}
        >
          অনুমোদিত স্বাক্ষর
        </div>
      </div>
    </div>
  );
});

const thStyle = {
  padding: "8px 10px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 600,
};

const tdStyle = {
  padding: "8px 10px",
  fontSize: "13px",
  textAlign: "left",
};

const tdStyleCenter = {
  ...tdStyle,
  textAlign: "center",
};

const tdStyleRight = {
  ...tdStyle,
  textAlign: "right",
};

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 12px",
        fontSize: "13px",
        color: "#222",
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default InvoiceTemplate;