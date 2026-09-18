import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Convert an HTML element to a PDF file and download it.
 *
 * Handles Bengali text well because it uses the browser's own rendering
 * (via html2canvas). Kalpurush is already loaded globally.
 */
export async function downloadElementAsPDF(element, filename = "document.pdf", options = {}) {
  if (!element) throw new Error("Element পাওয়া যায়নি");

  const {
    scale = 2,
    format = "a4",
    orientation = "portrait",
    margin = 8,
  } = options;

  // Ensure fonts are loaded
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format,
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  // First page
  pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight, undefined, "FAST");
  heightLeft -= pageHeight - margin * 2;

  // Additional pages
  while (heightLeft > 0) {
    position = heightLeft - contentHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight, undefined, "FAST");
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(filename);
  return pdf;
}

/**
 * Print an HTML element via browser print.
 * The element is cloned into a hidden print-only wrapper.
 */
export function printElement(element, title = "") {
  if (!element) throw new Error("Element পাওয়া যায়নি");

  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    throw new Error("Popup blocked — please allow popups");
  }

  // Copy current page's stylesheets
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join("\n");

  printWindow.document.write(`
    <!doctype html>
    <html lang="bn">
      <head>
        <meta charset="utf-8" />
        <title>${title || "Print"}</title>
        ${styles}
        <style>
          body { margin: 0; padding: 0; background: #fff; }
          .print-content { padding: 12mm; }
        </style>
      </head>
      <body>
        <div class="print-content">${element.outerHTML}</div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 300);
            }, 200);
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}