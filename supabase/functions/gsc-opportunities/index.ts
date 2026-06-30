// Returns keywords ranking on page 2 (positions 11-25) with decent impressions,
// grouped into topical clusters by shared stem tokens.
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

const STOP = new Set([
  "the","a","an","and","or","for","to","of","in","on","with","is","are","my","your",
  "how","what","why","best","top","near","me","i","do","does","can","you","vs","at",
  "be","by","that","this","it","from","as","so","we","us","our",
]);

function tokens(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && t.length > 2 && !STOP.has(t));
}

function cluster(rows: any[]) {
  // Group by the most-frequent shared token across each query.
  const freq = new Map<string, number>();
  for (const r of rows) for (const t of tokens(r.keys[0])) freq.set(t, (freq.get(t) ?? 0) + 1);

  const clusters = new Map<string, any[]>();
  for (const r of rows) {
    const ts = tokens(r.keys[0]);
    // pick the token that appears in the most other queries
    let key = ts[0] ?? "misc";
    let best = 0;
    for (const t of ts) {
      const f = freq.get(t) ?? 0;
      if (f > best) { best = f; key = t; }
    }
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push({
      keyword: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    });
  }
  return [...clusters.entries()]
    .map(([topic, items]) => ({
      topic,
      total_impressions: items.reduce((a, b) => a + b.impressions, 0),
      items: items.sort((a, b) => b.impressions - a.impressions),
    }))
    .sort((a, b) => b.total_impressions - a.total_impressions);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", claims.claims.sub).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const startDate = daysAgo(90);
    const endDate = daysAgo(2);

    const r = await fetch(
      `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "X-Connection-Api-Key": Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY") ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 1000, dataState: "all" }),
      },
    );
    const text = await r.text();
    if (!r.ok) throw new Error(`GSC ${r.status}: ${text}`);
    const data = JSON.parse(text);

    const rows = (data.rows ?? []).filter((row: any) => row.position >= 11 && row.position <= 25 && row.impressions >= 5);
    const clusters = cluster(rows);

    return new Response(JSON.stringify({ range: { startDate, endDate }, total: rows.length, clusters }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
