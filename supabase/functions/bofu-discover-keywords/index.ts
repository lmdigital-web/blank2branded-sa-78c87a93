import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SEMRUSH_API_KEY = Deno.env.get("SEMRUSH_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { seed } = await req.json();
    if (!seed) return json({ error: "seed required" }, 400);

    // 1. Get related keywords from Semrush (through gateway)
    let semrush: { keyword: string; volume: number | null; difficulty: number | null }[] = [];
    if (SEMRUSH_API_KEY && LOVABLE_API_KEY) {
      try {
        const url = `https://connector-gateway.lovable.dev/semrush/keywords/phrase_related?phrase=${encodeURIComponent(seed)}&database=za&export_columns=Ph,Nq,Kd&display_limit=50`;
        const r = await fetch(url, { headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": SEMRUSH_API_KEY } });
        if (r.ok) {
          const j = await r.json();
          const rows = j?.data?.rows ?? [];
          semrush = rows.map((row: string[]) => ({
            keyword: row[0], volume: row[1] ? parseInt(row[1], 10) : null, difficulty: row[2] ? parseFloat(row[2]) : null,
          }));
        }
      } catch (e) { console.warn("Semrush failed", e); }
    }

    // 2. Have AI generate additional BOFU variants if semrush was empty
    if (semrush.length === 0 && LOVABLE_API_KEY) {
      const prompt = `Generate 25 realistic bottom-of-funnel search queries in South Africa related to "${seed}". Mix these intents: versus (X vs Y), alternatives (alternatives to X), best (best X in [city]), local (X in Cape Town/Johannesburg/etc), price (X price / cheap X). Return STRICT JSON: {"keywords":[{"keyword":"...","volume":null,"difficulty":null}, ...]}`;
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ model: "google/gemini-3.5-flash", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
      });
      if (r.ok) {
        const j = await r.json();
        const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
        semrush = (parsed.keywords ?? []).slice(0, 25);
      }
    }

    // 3. Classify intent locally (regex-based, cheap & deterministic)
    const classify = (kw: string): string => {
      const k = kw.toLowerCase();
      if (/\bvs\b|versus/.test(k)) return "versus";
      if (/alternative|instead of/.test(k)) return "alternatives";
      if (/^best\b|top \d/.test(k)) return "best";
      if (/\bnear me\b|johannesburg|pretoria|cape town|durban|mbombela|bloemfontein|port elizabeth/.test(k)) return "local";
      if (/price|cheap|cost|affordable/.test(k)) return "price";
      return "other";
    };

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const rows = semrush.filter((r) => r.keyword).map((r) => ({
      keyword: r.keyword.toLowerCase().trim(),
      intent: classify(r.keyword),
      volume: r.volume ?? null,
      difficulty: r.difficulty ?? null,
      source: "semrush+ai",
      status: "new",
    }));

    if (rows.length > 0) {
      await supabase.from("bofu_keywords").upsert(rows, { onConflict: "keyword", ignoreDuplicates: false });
    }

    return json({ count: rows.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
