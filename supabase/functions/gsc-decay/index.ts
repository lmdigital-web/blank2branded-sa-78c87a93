// GSC Content Decay Monitor:
// Compare last 30 days vs prior 30 days for top 50 URLs and return % deltas.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE = "sc-domain:blank2branded.co.za";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function gscQuery(body: Record<string, unknown>) {
  const r = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
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

type Row = { keys: [string]; clicks: number; impressions: number; ctr: number; position: number };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: claims } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", claims.claims.sub).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    // Last 30d window: ends 2 days ago (GSC delay)
    const currEnd = daysAgo(2);
    const currStart = daysAgo(31);
    const prevEnd = daysAgo(32);
    const prevStart = daysAgo(61);

    const baseReq = (start: string, end: string) => ({
      startDate: start,
      endDate: end,
      dimensions: ["page"],
      rowLimit: 50,
      dataState: "all" as const,
    });

    const [curr, prev] = await Promise.all([
      gscQuery({ ...baseReq(currStart, currEnd) }),
      gscQuery(baseReq(prevStart, prevEnd)),
    ]);

    const prevMap = new Map<string, Row>();
    for (const r of (prev.rows ?? []) as Row[]) prevMap.set(r.keys[0], r);

    const out = ((curr.rows ?? []) as Row[]).map((r) => {
      const p = prevMap.get(r.keys[0]);
      const pc = p?.clicks ?? 0;
      const pi = p?.impressions ?? 0;
      const pp = p?.position ?? r.position;
      const clickDelta = pc === 0 ? (r.clicks > 0 ? 100 : 0) : ((r.clicks - pc) / pc) * 100;
      const imprDelta = pi === 0 ? (r.impressions > 0 ? 100 : 0) : ((r.impressions - pi) / pi) * 100;
      return {
        url: r.keys[0],
        current_clicks: r.clicks,
        previous_clicks: pc,
        current_impressions: r.impressions,
        previous_impressions: pi,
        click_delta_pct: clickDelta,
        impression_delta_pct: imprDelta,
        position_delta: r.position - pp, // positive = ranking got worse
      };
    });

    return json({ rows: out, window: { current: [currStart, currEnd], previous: [prevStart, prevEnd] } });
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
