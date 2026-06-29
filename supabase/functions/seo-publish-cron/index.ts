// Cron task (every 15 min):
// 1) Promote scheduled posts whose time has passed -> "published"
// 2) Submit any newly published post that has no submission yet
// 3) Check indexing status via GSC URL Inspection for submissions awaiting verification
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_BASE = "https://blank2branded.co.za";
const GSC_SITE = `${SITE_BASE}/`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const result: Record<string, unknown> = {};

  // 1) Promote scheduled -> published
  const { data: promoted, error: promErr } = await admin
    .from("posts")
    .update({ status: "published" })
    .eq("status", "scheduled")
    .lte("published_at", new Date().toISOString())
    .select("id,slug");
  result.promoted = promoted?.length ?? 0;
  if (promErr) result.promoteError = promErr.message;

  // 2) Find published posts without a submission, submit them
  const { data: published } = await admin
    .from("posts")
    .select("id,slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);

  const ids = (published ?? []).map((p) => p.id);
  let toSubmit: { id: string; slug: string }[] = [];
  if (ids.length > 0) {
    const { data: existing } = await admin
      .from("seo_submissions")
      .select("post_id")
      .in("post_id", ids);
    const have = new Set((existing ?? []).map((r) => r.post_id));
    toSubmit = (published ?? []).filter((p) => !have.has(p.id));
  }

  const submitted: string[] = [];
  for (const p of toSubmit) {
    const r = await fetch(`${supabaseUrl}/functions/v1/notify-search-engines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ post_id: p.id }),
    });
    if (r.ok) submitted.push(p.slug);
  }
  result.newlySubmitted = submitted;

  // 3) Check indexing for submissions older than 1h that are not yet "INDEXED"
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: pending } = await admin
    .from("seo_submissions")
    .select("id,url,indexing_state")
    .lte("submitted_at", oneHourAgo)
    .or("indexing_state.is.null,indexing_state.neq.PASS")
    .order("submitted_at", { ascending: false })
    .limit(20);

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  const checked: string[] = [];
  if (lovableKey && gscKey && pending) {
    for (const sub of pending) {
      try {
        const r = await fetch(
          "https://connector-gateway.lovable.dev/google_search_console/v1/urlInspection/index:inspect",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": gscKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inspectionUrl: sub.url, siteUrl: GSC_SITE }),
          },
        );
        if (!r.ok) continue;
        const data = await r.json();
        const verdict: string | null =
          data?.inspectionResult?.indexStatusResult?.verdict ?? null;
        const coverageState: string | null =
          data?.inspectionResult?.indexStatusResult?.coverageState ?? null;
        await admin
          .from("seo_submissions")
          .update({
            indexing_state: verdict,
            indexing_coverage: coverageState,
            indexing_checked_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        checked.push(sub.url);
      } catch (e) {
        console.error("inspect failed", sub.url, e);
      }
    }
  }
  result.checked = checked.length;

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
