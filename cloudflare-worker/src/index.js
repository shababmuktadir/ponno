/**
 * Product Management SaaS — API Gateway (Cloudflare Worker)
 *
 * Endpoints:
 *   GET  /api/sms/balance
 *   POST /api/sms/send    { phone, message }
 *   POST /api/email/send  { to, subject, html, text }
 *
 * Secrets (set via `npx wrangler secret put NAME`):
 *   BULKSMS_API_KEY
 *   BULKSMS_SENDER_ID
 *   RESEND_API_KEY
 *   FROM_EMAIL
 *   FROM_NAME
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ---------- SMS ----------
      if (path === "/api/sms/balance" && request.method === "GET") {
        return await handleSmsBalance(env);
      }
      if (path === "/api/sms/send" && request.method === "POST") {
        return await handleSmsSend(request, env);
      }

      // ---------- Email ----------
      if (path === "/api/email/send" && request.method === "POST") {
        return await handleEmailSend(request, env);
      }

      // ---------- Health ----------
      if (path === "/" || path === "/health") {
        return json({ ok: true, service: "pm-api", time: new Date().toISOString() });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message || "Server error" }, 500);
    }
  },
};

/* ============================================================
   SMS — Balance
   ============================================================ */
async function handleSmsBalance(env) {
  const apiKey = env.BULKSMS_API_KEY;
  if (!apiKey) return json({ error: "SMS not configured" }, 500);

  const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url);
  const text = await res.text();

  // Try to parse so client gets a proper number
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* not json */
  }

  return json(
    {
      success: res.ok,
      balance: parsed?.balance ?? null,
      raw: text,
    },
    res.ok ? 200 : 400
  );
}

/* ============================================================
   SMS — Send
   ============================================================ */
async function handleSmsSend(request, env) {
  const apiKey = env.BULKSMS_API_KEY;
  const senderId = env.BULKSMS_SENDER_ID;

  if (!apiKey || !senderId) {
    return json({ error: "SMS not configured" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { phone, message } = body;

  if (!phone || !/^8801\d{9}$/.test(phone)) {
    return json({ error: "Invalid phone (use 8801XXXXXXXXX)" }, 400);
  }
  if (!message || String(message).trim().length === 0) {
    return json({ error: "Message required" }, 400);
  }
  if (String(message).length > 1000) {
    return json({ error: "Message too long (max 1000 chars)" }, 400);
  }

  // Build URL with query params (bulksmsbd API format)
  const url = new URL("http://bulksmsbd.net/api/smsapi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("type", "text");
  url.searchParams.set("number", phone);
  url.searchParams.set("senderid", senderId);
  url.searchParams.set("message", message);

  const res = await fetch(url.toString());
  const text = await res.text();

  // ---------- Robust success detection ----------
  // BulkSMSBD returns:
  //   {"response_code":202,"message_id":123,"success_message":"SMS Submitted Successfully 1","error_message":""}
  // on success. A "202" code + non-empty success_message + empty error_message.
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* not json */
  }

  const hasError =
    typeof parsed?.error_message === "string" && parsed.error_message.length > 0;

  const isSuccess =
    res.ok &&
    !hasError &&
    (
      parsed?.response_code === 202 ||
      (typeof parsed?.success_message === "string" &&
        parsed.success_message.length > 0) ||
      /successfully/i.test(text)
    );

  return json(
    {
      success: isSuccess,
      raw: text,
      phone,
      messageId: parsed?.message_id ?? null,
      successMessage: parsed?.success_message || null,
      errorMessage: parsed?.error_message || null,
    },
    isSuccess ? 200 : 400
  );
}

/* ============================================================
   EMAIL — Send via Resend.com
   ============================================================ */
async function handleEmailSend(request, env) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.FROM_EMAIL;
  const fromName = env.FROM_NAME || "Team";

  if (!apiKey || !fromEmail) {
    return json(
      { error: "Email not configured (missing RESEND_API_KEY or FROM_EMAIL)" },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { to, subject, html, text } = body;

  if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
    return json({ error: "Invalid recipient email" }, 400);
  }
  if (!subject || String(subject).trim().length === 0) {
    return json({ error: "Subject required" }, 400);
  }
  if (!html && !text) {
    return json({ error: "Body required (html or text)" }, 400);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: html || `<p>${String(text).replace(/\n/g, "<br/>")}</p>`,
      text: text || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return json(
      {
        success: false,
        error: data.message || data.error || "Email send failed",
        details: data,
      },
      res.status
    );
  }

  return json({ success: true, id: data.id, to });
}

/* ============================================================
   HELPERS
   ============================================================ */
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}