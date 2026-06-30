// Google PageSpeed Insights proxy. Uses public API (no key required for low volume).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function psi(url: string, strategy: "mobile" | "desktop") {
  const key = Deno.env.get("PAGESPEED_API_KEY");
  const params = new URLSearchParams({ url, strategy, category: "PERFORMANCE" });
  if (key) params.set("key", key);
  // Retry once on 429/5xx with a short backoff
  let r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  if (r.status === 429 || r.status >= 500) {
    await new Promise((res) => setTimeout(res, 1500));
    r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  }
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const hint = r.status === 429 && !key ? " — add a PAGESPEED_API_KEY secret to lift the anonymous rate limit" : "";
    throw new Error(`PSI ${strategy} ${r.status}${hint}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  const j = await r.json();
  const lh = j.lighthouseResult;
  const audits = lh?.audits ?? {};
  return {
    score: Math.round((lh?.categories?.performance?.score ?? 0) * 100),
    lcp: audits["largest-contentful-paint"]?.displayValue ?? null,
    cls: audits["cumulative-layout-shift"]?.displayValue ?? null,
    fid: audits["max-potential-fid"]?.displayValue ?? audits["total-blocking-time"]?.displayValue ?? null,
    fcp: audits["first-contentful-paint"]?.displayValue ?? null,
    inp: audits["interaction-to-next-paint"]?.displayValue ?? null,
  };
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

    const { url } = await req.json().catch(() => ({ url: "https://blank2branded.co.za" }));
    const target = url || "https://blank2branded.co.za";

    const [mobile, desktop] = await Promise.all([psi(target, "mobile"), psi(target, "desktop")]);

    return new Response(JSON.stringify({ url: target, mobile, desktop, fetched_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
