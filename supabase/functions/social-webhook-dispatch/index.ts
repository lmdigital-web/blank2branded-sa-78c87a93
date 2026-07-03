import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = (Deno.env.get("SITE_URL") || "https://blank2branded.co.za").replace(/\/+$/, "");

function absolutize(u: string | null | undefined): string {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${SITE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { post_id, force } = await req.json().catch(() => ({}));
    if (!post_id || typeof post_id !== "string") {
      console.error("social-webhook-dispatch: missing post_id");
      return json({ error: "post_id required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [settingsRes, postRes] = await Promise.all([
      admin
        .from("app_settings")
        .select("social_webhook_url, auto_post_facebook_enabled")
        .eq("id", "default")
        .maybeSingle(),
      admin
        .from("posts")
        .select("id,title,slug,excerpt,cover_image_url,status")
        .eq("id", post_id)
        .maybeSingle(),
    ]);

    if (settingsRes.error) console.error("settings fetch error:", settingsRes.error.message);
    if (postRes.error) console.error("post fetch error:", postRes.error.message);

    const settings = settingsRes.data;
    const post = postRes.data;

    if (!post) return json({ error: "post not found" }, 404);

    // Only fire for published posts unless explicitly forced (test button)
    if (!force && post.status !== "published") {
      console.log(`skip: post ${post.id} status=${post.status} not published`);
      return json({ skipped: true, reason: `status=${post.status}` });
    }

    const enabled = !!settings?.auto_post_facebook_enabled;
    const url = (settings?.social_webhook_url || "").trim();

    if (!enabled || !url) {
      console.log(`skip: enabled=${enabled} hasUrl=${!!url}`);
      await admin
        .from("posts")
        .update({
          social_ping_status: "disabled",
          social_ping_error: null,
          social_ping_at: new Date().toISOString(),
        })
        .eq("id", post.id);
      return json({ skipped: true, reason: "auto-post disabled or no webhook URL" });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      const msg = `Invalid webhook URL: ${url}`;
      console.error(msg);
      await admin
        .from("posts")
        .update({
          social_ping_status: "failed",
          social_ping_error: msg,
          social_ping_at: new Date().toISOString(),
        })
        .eq("id", post.id);
      return json({ status: "failed", error: msg }, 200);
    }

    const payload = {
      title: post.title,
      url: `${SITE_URL}/blog/${post.slug}/`,
      excerpt: post.excerpt || "",
      featured_image: absolutize(post.cover_image_url),
    };

    console.log(`POST ${url}`, JSON.stringify(payload));

    let status: "sent" | "failed" = "sent";
    let errorMsg: string | null = null;
    let respStatus = 0;
    let respBody = "";

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15_000);
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json,text/plain,*/*",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(t);
      respStatus = r.status;
      respBody = await r.text().catch(() => "");
      if (!r.ok) {
        status = "failed";
        errorMsg = `HTTP ${r.status}${respBody ? `: ${respBody.slice(0, 300)}` : ""}`;
        console.error("webhook non-2xx:", errorMsg);
      } else {
        console.log(`webhook delivered: HTTP ${r.status}`);
      }
    } catch (e) {
      status = "failed";
      errorMsg = (e as Error).message || String(e);
      console.error("webhook fetch threw:", errorMsg);
    }

    await admin
      .from("posts")
      .update({
        social_ping_status: status,
        social_ping_error: errorMsg,
        social_ping_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    return json({ status, error: errorMsg, http_status: respStatus, payload });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    console.error("social-webhook-dispatch fatal:", msg);
    return json({ error: msg }, 500);
  }
});
