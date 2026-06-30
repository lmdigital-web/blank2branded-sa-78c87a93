// Replaces a broken shop URL in a blog post's content with a working product URL,
// then marks the corresponding blog_link_issues row as resolved.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const issueId: string = body.issue_id;
    const newHandle: string = body.new_handle;
    if (!issueId || !newHandle) {
      return new Response(JSON.stringify({ error: "issue_id and new_handle required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: issue, error: iErr } = await admin
      .from("blog_link_issues")
      .select("id,post_id,url")
      .eq("id", issueId)
      .single();
    if (iErr || !issue) throw new Error(iErr?.message || "Issue not found");

    const { data: post, error: pErr } = await admin
      .from("posts")
      .select("id,content")
      .eq("id", issue.post_id)
      .single();
    if (pErr || !post) throw new Error(pErr?.message || "Post not found");

    const newUrl = `/products/${newHandle}`;
    const escaped = issue.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const updatedContent = (post.content || "").replace(new RegExp(escaped, "g"), newUrl);

    if (updatedContent === post.content) {
      // URL no longer present; just resolve the issue
      await admin
        .from("blog_link_issues")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", issueId);
      return new Response(JSON.stringify({ ok: true, replaced: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: uErr } = await admin
      .from("posts")
      .update({ content: updatedContent, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    if (uErr) throw uErr;

    await admin
      .from("blog_link_issues")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", issueId);

    return new Response(JSON.stringify({ ok: true, new_url: newUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
