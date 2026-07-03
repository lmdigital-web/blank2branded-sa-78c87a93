// Pings Google sitemap, IndexNow, and Google Indexing API for one or more URLs.
// Logs each ping to seo_submissions. Auth: admin or service role.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_BASE = "https://blank2branded.co.za";
const SITEMAP_URL = `${SITE_BASE}/sitemap.xml`;
const INDEXNOW_KEY = "50aa9fdf66e41a5111aaa4f1b2be315b";
const INDEXNOW_KEY_LOCATION = `${SITE_BASE}/${INDEXNOW_KEY}.txt`;

interface Body {
  post_id?: string;
  urls?: string[];
  action?: "URL_UPDATED" | "URL_DELETED";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerIsService = authHeader === `Bearer ${serviceKey}`;
    if (!callerIsService) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const { data: userRes } = await admin.auth.getUser(token);
      if (!userRes?.user) return json({ error: "unauthorized" }, 401);
      const { data: roleRow } = await admin
        .from("user_roles").select("role")
        .eq("user_id", userRes.user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) return json({ error: "forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action ?? "URL_UPDATED";
    let urls = body.urls ?? [];

    if (body.post_id) {
      const { data: post } = await admin
        .from("posts").select("slug,status").eq("id", body.post_id).maybeSingle();
      if (post?.slug && (post.status === "published" || action === "URL_DELETED")) {
        urls = [...urls, `${SITE_BASE}/blog/${post.slug}/`];
      }
    }

    urls = [...new Set(urls.filter((u) => u && u.startsWith(SITE_BASE)))];
    if (urls.length === 0) return json({ error: "no urls to submit" }, 400);

    // 1) Google sitemap ping (legacy)
    let googleOk = false;
    let googleStatus = 0;
    try {
      const r = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
      googleStatus = r.status; googleOk = r.ok;
    } catch { /* ignore */ }

    // 2) IndexNow
    let indexNowOk = false;
    let indexNowStatus = 0;
    try {
      const r = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: new URL(SITE_BASE).host,
          key: INDEXNOW_KEY,
          keyLocation: INDEXNOW_KEY_LOCATION,
          urlList: urls,
        }),
      });
      indexNowStatus = r.status;
      indexNowOk = r.status === 200 || r.status === 202;
    } catch { /* ignore */ }

    // 3) Google Indexing API (per-URL, requires service account)
    const googleIndexing: { url: string; ok: boolean; status: number; error?: string }[] = [];
    let indexingToken: string | null = null;
    try {
      indexingToken = await getGoogleIndexingToken();
    } catch (e) {
      console.warn("Google Indexing token unavailable:", (e as Error).message);
    }
    if (indexingToken) {
      for (const url of urls) {
        try {
          const r = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${indexingToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, type: action }),
          });
          const t = await r.text();
          googleIndexing.push({ url, ok: r.ok, status: r.status, ...(r.ok ? {} : { error: t.slice(0, 240) }) });
        } catch (e) {
          googleIndexing.push({ url, ok: false, status: 0, error: (e as Error).message });
        }
      }
    }

    // 4) Log one submission row per URL
    const rows = urls.map((url) => {
      const gi = googleIndexing.find((g) => g.url === url);
      return {
        post_id: body.post_id ?? null,
        url,
        google_ping_ok: googleOk,
        google_ping_status: googleStatus,
        indexnow_ok: indexNowOk,
        indexnow_status: indexNowStatus,
        indexing_state: gi ? (gi.ok ? "submitted" : "failed") : (indexingToken ? "failed" : "skipped"),
        indexing_checked_at: gi ? new Date().toISOString() : null,
      };
    });
    const { error: insErr } = await admin.from("seo_submissions").insert(rows);
    if (insErr) console.error("insert failed", insErr);

    return json({
      ok: true,
      submitted: urls.length,
      google: { ok: googleOk, status: googleStatus },
      indexnow: { ok: indexNowOk, status: indexNowStatus },
      google_indexing: indexingToken
        ? { configured: true, results: googleIndexing }
        : { configured: false, hint: "Set GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON to enable instant indexing." },
    });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Google Indexing API auth (service-account JWT → access token) ---

function pemToPkcs8(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getGoogleIndexingToken(): Promise<string> {
  const raw = Deno.env.get("GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON not set");
  const sa = JSON.parse(raw) as { client_email: string; private_key: string; token_uri?: string };
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)),
  );
  const jwt = `${unsigned}.${base64url(sig)}`;

  const tokRes = await fetch(claim.aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tok = await tokRes.json();
  if (!tokRes.ok) throw new Error(`token exchange failed: ${JSON.stringify(tok)}`);
  return tok.access_token as string;
}
