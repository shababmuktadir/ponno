import { forwardRef } from "react";
import { toBanglaNumber, formatTaka } from "@/utils/banglaNumber";
import { toBanglaDate } from "@/utils/banglaDate";

/**
 * A4-sized report template for all report types.
 * Edit styles here to change report appearance globally.
 */
const ReportTemplate = forwardRef(function ReportTemplate(
  { report, branding, reportType = "sales" },
  ref
) {
  if (!report) return null;

  return (
    <div
      ref={ref}
      className="report-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm",
        background: "#ffffff",
        color: "#000000",
        fontFamily: "'Kalpurush', 'Noto Sans Bengali', sans-serif",
        fontSize: "13px",
        lineHeight: 1.5,
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          borderBottom: "2px solid #0B0B0C",
          paddingBottom: "14px",
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
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
            {report.title || "রিপোর্ট"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#444" }}>
            তৈরি: {toBanglaDate(new Date())}
          </p>
          {report.period && (
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#666" }}>
              সময়কাল: {report.period}
            </p>
          )}
        </div>
      </div>

      {/* SUMMARY STATS */}
      {report.totals && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          {Object.entries(report.totals).slice(0, 8).map(([key, value]) => (
            <div
              key={key}
              style={{
                background: "#f7f7f7",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #e5e5e5",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {LABELS[key] || key}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {isMoneyKey(key) ? formatTaka(value) : toBanglaNumber(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      {report.rows && report.rows.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "16px",
          }}
        >
          <thead>
            <tr style={{ background: "#0B0B0C", color: "#fff" }}>
              <th style={thStyle}>ক্রম</th>
              {renderHeaderCells(reportType)}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #e5e5e5",
                  background: i % 2 === 0 ? "#fafafa" : "#fff",
                }}
              >
                <td style={tdStyleCenter}>{toBanglaNumber(i + 1)}</td>
                {renderBodyCells(reportType, row)}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {report.rows && report.rows.length === 0 && (
        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: "#666",
            fontSize: "13px",
          }}
        >
          এই সময়কালে কোনো ডেটা নেই
        </p>
      )}

      {/* FOOTER */}
      <div
        style={{
          marginTop: "60px",
          paddingTop: "10px",
          borderTop: "1px solid #ccc",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#666",
        }}
      >
        <p style={{ margin: 0 }}>
          এই রিপোর্ট কম্পিউটার জেনারেটেড — {branding?.businessName || ""}
        </p>
        <p style={{ margin: 0 }}>
          পৃষ্ঠা: ১
        </p>
      </div>
    </div>
  );
});

const LABELS = {
  totalSales: "মোট বিক্রয়",
  totalPurchases: "মোট ক্রয়",
  totalQtySold: "বিক্রি পরিমাণ",
  totalQtyBought: "ক্রয় পরিমাণ",
  count: "সংখ্যা",
  totalStock: "মোট স্টক",
  totalValue: "স্টক মূল্য",
  lowStock: "কম স্টক",
  outOfStock: "স্টক নেই",
  profit: "মুনাফা",
  totalBalance: "ব্যালেন্স",
  totalRevenue: "মোট আয়",
  totalSold: "মোট বিক্রি",
};

const MONEY_KEYS = [
  "totalSales",
  "totalPurchases",
  "totalValue",
  "profit",
  "totalBalance",
  "totalRevenue",
];

function isMoneyKey(key) {
  return MONEY_KEYS.includes(key);
}

const thStyle = {
  padding: "8px 10px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 600,
};

const tdStyle = {
  padding: "6px 10px",
  fontSize: "12px",
};

const tdStyleCenter = {
  ...tdStyle,
  textAlign: "center",
};

const tdStyleRight = {
  ...tdStyle,
  textAlign: "right",
};

/* Column sets per report type */

function renderHeaderCells(type) {
  switch (type) {
    case "sales":
      return (
        <>
          <th style={thStyle}>তারিখ</th>
          <th style={thStyle}>প্রোডাক্ট</th>
          <th style={thStyle}>মডেল</th>
          <th style={thStyle}>পরিমাণ</th>
          <th style={thStyle}>ইউনিট দর</th>
          <th style={thStyle}>মোট</th>
        </>
      );
    case "stock":
      return (
        <>
          <th style={thStyle}>প্রোডাক্ট</th>
          <th style={thStyle}>মডেল</th>
          <th style={thStyle}>ক্যাটাগরি</th>
          <th style={thStyle}>স্টক</th>
          <th style={thStyle}>ক্রয় মূল্য</th>
          <th style={thStyle}>স্টক মূল্য</th>
        </>
      );
    case "customer":
      return (
        <>
          <th style={thStyle}>নাম</th>
          <th style={thStyle}>ফোন</th>
          <th style={thStyle}>ইমেইল</th>
          <th style={thStyle}>ব্যালেন্স</th>
        </>
      );
    case "product":
      return (
        <>
          <th style={thStyle}>প্রোডাক্ট</th>
          <th style={thStyle}>মডেল</th>
          <th style={thStyle}>স্টক</th>
          <th style={thStyle}>বিক্রয় মূল্য</th>
          <th style={thStyle}>বিক্রি পরিমাণ</th>
          <th style={thStyle}>মোট আয়</th>
        </>
      );
    case "income":
      return (
        <>
          <th style={thStyle}>বিবরণ</th>
          <th style={thStyle}>পরিমাণ</th>
        </>
      );
    default:
      return null;
  }
}

function renderBodyCells(type, row) {
  switch (type) {
    case "sales":
      return (
        <>
          <td style={tdStyle}>{toBanglaDate(row.date)}</td>
          <td style={tdStyle}>{row.productName}</td>
          <td style={tdStyle}>{row.model || "—"}</td>
          <td style={tdStyleCenter}>{toBanglaNumber(row.qty)}</td>
          <td style={tdStyleRight}>{formatTaka(row.unitPrice)}</td>
          <td style={tdStyleRight}>{formatTaka(row.total)}</td>
        </>
      );
    case "stock":
      return (
        <>
          <td style={tdStyle}>{row.productName}</td>
          <td style={tdStyle}>{row.model || "—"}</td>
          <td style={tdStyle}>{row.categoryName}</td>
          <td style={tdStyleCenter}>{toBanglaNumber(row.currentStock)}</td>
          <td style={tdStyleRight}>{formatTaka(row.buyPrice)}</td>
          <td style={tdStyleRight}>{formatTaka(row.stockValue)}</td>
        </>
      );
    case "customer":
      return (
        <>
          <td style={tdStyle}>{row.name}</td>
          <td style={tdStyle}>{row.phone}</td>
          <td style={tdStyle}>{row.email || "—"}</td>
          <td style={tdStyleRight}>{formatTaka(row.balance)}</td>
        </>
      );
    case "product":
      return (
        <>
          <td style={tdStyle}>{row.productName}</td>
          <td style={tdStyle}>{row.model || "—"}</td>
          <td style={tdStyleCenter}>{toBanglaNumber(row.currentStock)}</td>
          <td style={tdStyleRight}>{formatTaka(row.sellPrice)}</td>
          <td style={tdStyleCenter}>{toBanglaNumber(row.totalSold)}</td>
          <td style={tdStyleRight}>{formatTaka(row.revenue)}</td>
        </>
      );
    case "income":
      return (
        <>
          <td style={tdStyle}>{row.label}</td>
          <td style={tdStyleRight}>{formatTaka(row.value)}</td>
        </>
      );
    default:
      return null;
  }
}

export default ReportTemplate;