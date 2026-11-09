import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { seed } = await req.json();
    if (!seed) return json({ error: "seed required" }, 400);

    // 1. Get related keywords from Semrush if a direct API key is configured
    let semrush: { keyword: string; volume: number | null; difficulty: number | null }[] = [];
    const semrushKey = Deno.env.get("SEMRUSH_API_KEY");
    if (semrushKey) {
      try {
        const url = `https://api.semrush.com/?type=phrase_related&phrase=${encodeURIComponent(seed)}&database=za&export_columns=Ph,Nq,Kd&display_limit=50&key=${semrushKey}`;
        const r = await fetch(url);
        if (r.ok) {
          const text = await r.text();
          const lines = text.trim().split("\n");
          // Semrush returns a TSV with a header line
          for (const line of lines.slice(1)) {
            const cols = line.split(";");
            if (cols[0]) {
              semrush.push({
                keyword: cols[0],
                volume: cols[1] ? parseInt(cols[1], 10) : null,
                difficulty: cols[2] ? parseFloat(cols[2]) : null,
              });
            }
          }
        }
      } catch (e) { console.warn("Semrush failed", e); }
    }

    // 2. Have AI generate BOFU variants (always, to supplement Semrush)
    if (OPENAI_API_KEY) {
      const prompt = `Generate 25 realistic bottom-of-funnel search queries in South Africa related to "${seed}". Mix these intents: versus (X vs Y), alternatives (alternatives to X), best (best X in [city]), local (X in Cape Town/Johannesburg/etc), price (X price / cheap X). Return STRICT JSON: {"keywords":[{"keyword":"...","volume":null,"difficulty":null}, ...]}`;
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: "Always output valid JSON only. No markdown fences." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
        semrush = [...semrush, ...((parsed.keywords ?? []) as { keyword: string; volume: number | null; difficulty: number | null }[])].slice(0, 50);
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
