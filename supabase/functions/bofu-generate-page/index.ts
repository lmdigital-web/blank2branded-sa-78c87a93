import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

  try {
    const { template, keyword, competitor, city } = await req.json();
    if (!keyword) return json({ error: "keyword required" }, 400);

    const guidance: Record<string, string> = {
      versus: `Write a comparison landing page: "Blank2Branded vs ${competitor || "competitor"}". Compare pricing, product range, turnaround, print quality, minimum orders, delivery. Position Blank2Branded fairly but favorably. Include a comparison table (as HTML) in body_html.`,
      alternatives: `Write an "Alternatives to ${competitor || keyword}" listicle. Include Blank2Branded as the top recommendation plus 4-5 other real South African competitors. Include a table in body_html.`,
      best: `Write a "best ${keyword}" listicle for South African buyers. Position Blank2Branded as one of the top options. Include criteria, comparison table, and pros/cons.`,
      local: `Write a landing page targeting buyers in ${city || "South Africa"} searching for "${keyword}". Emphasize local delivery, courier options to ${city}, turnaround time. Include local context.`,
    };

    const prompt = `You are an expert South African SEO copywriter for Blank2Branded (blank2branded.co.za), a Mbombela-based supplier of DTF transfers, blank apparel (t-shirts, golf shirts, hoodies), sublimation apparel, and branded gifts, delivering nationwide.

Focus keyword: "${keyword}"
Template type: ${template}
${guidance[template] || guidance.best}

Return STRICT JSON with these exact keys (no markdown, no code fence):
{
  "title": "SEO title <60 chars including focus keyword",
  "meta_description": "compelling meta <160 chars including focus keyword and 'South Africa'",
  "h1": "H1 heading including focus keyword (not identical to title)",
  "intro": "2-3 sentence intro using focus keyword in first sentence",
  "body_html": "HTML with h2/h3 headings, at least one <table> if template is versus/alternatives/best, and internal links to /shop, /dtf, /blanks, /contact where relevant. 600-900 words.",
  "faq_json": [{"q":"...","a":"..."}, ... at least 6 real People-Also-Ask style questions with concise answers]
}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI Gateway error", resp.status, t);
      return json({ error: `AI Gateway ${resp.status}`, details: t }, resp.status);
    }
    const j = await resp.json();
    const content = j.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { return json({ error: "AI returned non-JSON", content }, 500); }
    return json(parsed);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
