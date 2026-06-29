// Google Search Console stats proxy for admin dashboard
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "sc-domain:blank2branded.co.za";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function gscQuery(body: Record<string, unknown>) {
  const r = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "X-Connection-Api-Key": Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY") ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const text = await r.text();
  if (!r.ok) throw new Error(`GSC ${r.status}: ${text}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify caller is admin
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: claims, error: cErr } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { days = 28 } = await req.json().catch(() => ({}));
    const startDate = daysAgo(Number(days) + 2);
    const endDate = daysAgo(2); // GSC has ~2 day delay

    const base = { startDate, endDate, dataState: "all" as const };

    const [totals, byDate, byQuery, byPage, byCountry] = await Promise.all([
      gscQuery({ ...base, dimensions: [] }),
      gscQuery({ ...base, dimensions: ["date"], rowLimit: 100 }),
      gscQuery({ ...base, dimensions: ["query"], rowLimit: 25 }),
      gscQuery({ ...base, dimensions: ["page"], rowLimit: 25 }),
      gscQuery({ ...base, dimensions: ["country"], rowLimit: 10 }),
    ]);

    return new Response(
      JSON.stringify({
        site: SITE_URL,
        range: { startDate, endDate, days },
        totals: totals.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        byDate: byDate.rows ?? [],
        byQuery: byQuery.rows ?? [],
        byPage: byPage.rows ?? [],
        byCountry: byCountry.rows ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
