/**
 * Email marketing service via Cloudflare Worker (Gmail SMTP proxy).
 *
 * Worker env vars:
 *   GMAIL_USER        - your gmail address
 *   GMAIL_APP_PASS    - gmail app-specific password (16 chars)
 *   FROM_NAME         - display name, e.g. "Walton Team"
 */

export async function sendEmail({ to, subject, html, text }) {
  const base = import.meta.env.VITE_SERVERLESS_BASE_URL;
  if (!base) throw new Error("Email gateway not configured");

  if (!to) throw new Error("ইমেইল নেই");
  if (!subject?.trim()) throw new Error("বিষয় দিন");
  if (!html && !text) throw new Error("বার্তা খালি");

  const res = await fetch(`${base}/api/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html, text }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "ইমেইল পাঠানো যায়নি");
  return data;
}

export async function sendBulkEmail({ recipients, subject, html, text, onProgress }) {
  const results = { sent: 0, failed: 0, errors: [] };
  for (let i = 0; i < recipients.length; i++) {
    try {
      await sendEmail({ to: recipients[i], subject, html, text });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ email: recipients[i], error: err.message });
    }
    if (onProgress) onProgress(i + 1, recipients.length);
    // Gmail rate — safe
    await new Promise((r) => setTimeout(r, 800));
  }
  return results;
}