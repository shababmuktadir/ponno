/**
 * Product Management SaaS — API Gateway (Cloudflare Worker)
 *
 * Endpoints:
 *   GET  /api/sms/balance
 *   POST /api/sms/send    { phone, message }
 *   POST /api/email/send  { to, subject, html, text }
 *   POST /api/fcm/send    { title, message, url, tokens[] }
 *
 * Secrets (wrangler secret put):
 *   BULKSMS_API_KEY
 *   BULKSMS_SENDER_ID
 *   RESEND_API_KEY
 *   FROM_EMAIL
 *   FROM_NAME
 *   FIREBASE_SERVICE_ACCOUNT   (one-line JSON)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/sms/balance" && request.method === "GET") {
        return await handleSmsBalance(env);
      }
      if (path === "/api/sms/send" && request.method === "POST") {
        return await handleSmsSend(request, env);
      }
      if (path === "/api/email/send" && request.method === "POST") {
        return await handleEmailSend(request, env);
      }
      if (path === "/api/fcm/send" && request.method === "POST") {
        return await handleFcmSend(request, env);
      }
      if (path === "/" || path === "/health") {
        return json({
          ok: true,
          service: "pm-api",
          endpoints: [
            "GET  /api/sms/balance",
            "POST /api/sms/send",
            "POST /api/email/send",
            "POST /api/fcm/send",
          ],
        });
      }
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message || "Server error" }, 500);
    }
  },
};

/* ============================================================
   SMS — BALANCE
   ============================================================ */

async function handleSmsBalance(env) {
  const apiKey = env.BULKSMS_API_KEY;
  if (!apiKey) return json({ error: "SMS not configured" }, 500);

  const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url);
  const text = await res.text();

  return new Response(JSON.stringify({ success: true, raw: text }), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/* ============================================================
   SMS — SEND
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
  if (!message || message.trim().length === 0) {
    return json({ error: "Message required" }, 400);
  }
  if (message.length > 1000) {
    return json({ error: "Message too long (max 1000 chars)" }, 400);
  }

  const url = new URL("http://bulksmsbd.net/api/smsapi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("type", "text");
  url.searchParams.set("number", phone);
  url.searchParams.set("senderid", senderId);
  url.searchParams.set("message", message);

  const res = await fetch(url.toString());
  const text = await res.text();

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* not json */
  }

  const isSuccess =
    res.ok &&
    (parsed?.response_code === 202 ||
      (typeof parsed?.success_message === "string" &&
        parsed.success_message.length > 0) ||
      /success/i.test(text)) &&
    !(typeof parsed?.error_message === "string" &&
      parsed.error_message.length > 0);

  return json(
    {
      success: isSuccess,
      raw: text,
      phone,
      messageId: parsed?.message_id || null,
      successMessage: parsed?.success_message || null,
      errorMessage: parsed.error_message || null,
    },
    isSuccess ? 200 : 400
  );
}

/* ============================================================
   EMAIL — SEND (via Resend.com)
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
  if (!subject || !subject.trim()) {
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
      html: html || `<p>${text}</p>`,
      text: text || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return json(
      { error: data.message || "Email send failed", details: data },
      res.status
    );
  }

  return json({ success: true, id: data.id });
}

/* ============================================================
   FCM — PUSH
   ============================================================ */

async function handleFcmSend(request, env) {
  const saJson = env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJson) {
    return json(
      { error: "FCM not configured (missing FIREBASE_SERVICE_ACCOUNT)" },
      500
    );
  }

  let sa;
  try {
    sa =
      typeof saJson === "string"
        ? JSON.parse(saJson)
        : saJson;
  } catch {
    return json({ error: "FIREBASE_SERVICE_ACCOUNT invalid JSON" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { title, message, url, tokens } = body;
  if (!title || !message) {
    return json({ error: "title & message required" }, 400);
  }
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return json({ success: true, sent: 0, skipped: "no tokens" });
  }

  let accessToken;
  try {
    accessToken = await getGoogleAccessToken(sa);
  } catch (err) {
    return json(
      { error: "Failed to get Google access token", details: err.message },
      500
    );
  }

  const projectId = sa.project_id;
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const token of tokens.slice(0, 500)) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body: message },
            webpush: {
              notification: {
                title,
                body: message,
                icon: "/icons/pwa-192.png",
                badge: "/icons/pwa-192.png",
                tag: "pm-notification",
                renotify: true,
              },
              fcmOptions: { link: url || "/notifications" },
            },
            data: {
              url: url || "/notifications",
              tag: "pm-notification",
            },
          },
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        failed++;
        const err = await res.json().catch(() => ({}));
        errors.push(err?.error?.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      failed++;
      errors.push(err.message);
    }
  }

  return json({
    success: true,
    sent,
    failed,
    errors: errors.slice(0, 5),
  });
}

/* ============================================================
   Google OAuth2 (JWT → access token)
   ============================================================ */

async function getGoogleAccessToken(sa) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj) => base64urlEncode(JSON.stringify(obj));

  const toSign = `${enc(header)}.${enc(claims)}`;
  const signature = await signRS256(toSign, sa.private_key);
  const jwt = `${toSign}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth failed: ${data.error || "unknown"}`);
  }
  return data.access_token;
}

function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signRS256(data, pemPrivateKey) {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const keyBody = pemPrivateKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s+/g, "");

  const keyBytes = Uint8Array.from(atob(keyBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(data)
  );

  let binary = "";
  for (const b of new Uint8Array(signature)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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