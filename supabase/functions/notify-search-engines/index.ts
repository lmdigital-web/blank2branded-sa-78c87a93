// Pings Google sitemap + IndexNow for one or more URLs, logs to seo_submissions.
// Auth: requires a valid Supabase JWT belonging to an admin.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_BASE = "https://blank2branded.co.za";
const SITEMAP_URL = `${SITE_BASE}/sitemap.xml`;
const INDEXNOW_KEY = "50aa9fdf66e41a5111aaa4f1b2be315b";
const INDEXNOW_KEY_LOCATION = `${SITE_BASE}/${INDEXNOW_KEY}.txt`;

interface Body {
  post_id?: string;
  urls?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Auth: caller must be admin (unless invoked with service role from cron)
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerIsService = authHeader === `Bearer ${serviceKey}`;
    if (!callerIsService) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const { data: userRes } = await admin.auth.getUser(token);
      if (!userRes?.user) {
        return json({ error: "unauthorized" }, 401);
      }
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userRes.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) return json({ error: "forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    let urls = body.urls ?? [];

    // Resolve URL from post_id if provided
    if (body.post_id) {
      const { data: post } = await admin
        .from("posts")
        .select("slug,status")
        .eq("id", body.post_id)
        .maybeSingle();
      if (post?.slug && post.status === "published") {
        urls = [...urls, `${SITE_BASE}/blog/${post.slug}`];
      }
    }

    urls = [...new Set(urls.filter((u) => u && u.startsWith(SITE_BASE)))];
    if (urls.length === 0) return json({ error: "no urls to submit" }, 400);

    // 1) Ping Google sitemap (legacy but still accepted)
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    let googleOk = false;
    let googleStatus = 0;
    try {
      const r = await fetch(googlePingUrl, { method: "GET" });
      googleStatus = r.status;
      googleOk = r.ok;
    } catch (_e) {
      googleOk = false;
    }

    // 2) IndexNow (Bing/Yandex/Seznam/Naver)
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
      // IndexNow returns 200 or 202 on success
      indexNowOk = r.status === 200 || r.status === 202;
    } catch (_e) {
      indexNowOk = false;
    }

    // 3) Log one submission row per URL
    const rows = urls.map((url) => ({
      post_id: body.post_id ?? null,
      url,
      google_ping_ok: googleOk,
      google_ping_status: googleStatus,
      indexnow_ok: indexNowOk,
      indexnow_status: indexNowStatus,
      indexing_state: null,
      indexing_checked_at: null,
    }));
    const { error: insErr } = await admin.from("seo_submissions").insert(rows);
    if (insErr) console.error("insert failed", insErr);

    return json({
      ok: true,
      submitted: urls.length,
      google: { ok: googleOk, status: googleStatus },
      indexnow: { ok: indexNowOk, status: indexNowStatus },
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
