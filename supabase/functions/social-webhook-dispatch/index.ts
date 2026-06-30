import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_URL = (Deno.env.get("SITE_URL") || "https://blank2branded.co.za").replace(/\/+$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { post_id } = await req.json().catch(() => ({}));
    if (!post_id || typeof post_id !== "string") {
      return json({ error: "post_id required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: settings }, { data: post }] = await Promise.all([
      admin.from("app_settings").select("social_webhook_url, auto_post_facebook_enabled").eq("id", "default").maybeSingle(),
      admin.from("posts").select("id,title,slug,excerpt,cover_image_url,status").eq("id", post_id).maybeSingle(),
    ]);

    if (!post) return json({ error: "post not found" }, 404);

    if (!settings?.auto_post_facebook_enabled || !settings.social_webhook_url) {
      await admin.from("posts").update({
        social_ping_status: "disabled",
        social_ping_error: null,
        social_ping_at: new Date().toISOString(),
      }).eq("id", post.id);
      return json({ skipped: true, reason: "auto-post disabled or no webhook URL" });
    }

    const payload = {
      title: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      excerpt: post.excerpt || "",
      featured_image: post.cover_image_url || "",
    };

    let status: "sent" | "failed" = "sent";
    let errorMsg: string | null = null;
    try {
      const r = await fetch(settings.social_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        status = "failed";
        const txt = await r.text().catch(() => "");
        errorMsg = `HTTP ${r.status}${txt ? `: ${txt.slice(0, 200)}` : ""}`;
      }
    } catch (e) {
      status = "failed";
      errorMsg = (e as Error).message;
    }

    await admin.from("posts").update({
      social_ping_status: status,
      social_ping_error: errorMsg,
      social_ping_at: new Date().toISOString(),
    }).eq("id", post.id);

    return json({ status, error: errorMsg, payload });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
