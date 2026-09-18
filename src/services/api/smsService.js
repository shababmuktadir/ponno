/**
 * SMS Service via Cloudflare Worker
 *
 * Worker env vars:
 *   BULKSMS_API_KEY    - your bulk sms bd api key
 *   BULKSMS_SENDER_ID  - your sender id
 *
 * Frontend .env:
 *   VITE_SERVERLESS_BASE_URL - e.g. https://your-worker.workers.dev
 *
 * Bengali digits → English for API
 */

const BULK_API_URL = "http://bulksmsbd.net/api/smsapi";

function toEnglishDigits(str) {
  return String(str || "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
}

export function normalizePhoneForSMS(phone) {
  const cleaned = toEnglishDigits(phone).replace(/[^0-9]/g, "");
  if (cleaned.startsWith("880")) return cleaned;
  if (cleaned.startsWith("0")) return "88" + cleaned;
  if (cleaned.startsWith("1") && cleaned.length === 10) return "880" + cleaned;
  return cleaned;
}

/**
 * Send SMS via Cloudflare Worker (proxy that holds the API secret)
 */
export async function sendSMS({ phone, message }) {
  const base = import.meta.env.VITE_SERVERLESS_BASE_URL;
  if (!base) throw new Error("SMS gateway not configured (missing VITE_SERVERLESS_BASE_URL)");

  const normalizedPhone = normalizePhoneForSMS(phone);
  if (!/^8801\d{9}$/.test(normalizedPhone)) {
    throw new Error(`ভুল ফোন নাম্বার: ${phone}`);
  }

  const res = await fetch(`${base}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: normalizedPhone, message }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "SMS পাঠানো যায়নি");
  }
  return data;
}

export async function sendBulkSMS({ phones, message, onProgress }) {
  const results = { sent: 0, failed: 0, errors: [] };
  for (let i = 0; i < phones.length; i++) {
    try {
      await sendSMS({ phone: phones[i], message });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ phone: phones[i], error: err.message });
    }
    if (onProgress) onProgress(i + 1, phones.length);
    // rate limit — bulk sms bd 1 per 200ms safe
    await new Promise((r) => setTimeout(r, 250));
  }
  return results;
}

export async function getSMSBalance() {
  const base = import.meta.env.VITE_SERVERLESS_BASE_URL;
  if (!base) throw new Error("SMS gateway not configured");
  const res = await fetch(`${base}/api/sms/balance`, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "ব্যালেন্স পাওয়া যায়নি");
  return data;
}