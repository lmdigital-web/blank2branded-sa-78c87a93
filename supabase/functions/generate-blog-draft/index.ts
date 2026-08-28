import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body = {
  topic: string;
  keyword: string;
  tone?: string;
  wordCount?: number;
  audience?: string;
  intent?: string;
  includeFaq?: boolean;
  includeInternalLinks?: boolean;
  includeProducts?: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

function stripFences(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

const INTERNAL_LINKS = [
  { url: "/dtf", label: "DTF printing and transfers", reason: "Relevant DTF service page" },
  { url: "/blanks", label: "blank apparel", reason: "Relevant blank apparel page" },
  { url: "/shop", label: "shop", reason: "Relevant catalogue/shop page" },
  { url: "/catalogues", label: "catalogues", reason: "Useful for browsing product catalogues" },
  { url: "/contact", label: "contact Blank2Branded", reason: "Useful conversion/quote CTA" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: Body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  const topic = String(body.topic ?? "").trim();
  const keyword = String(body.keyword ?? "").trim();
  if (!topic || !keyword) return new Response(JSON.stringify({ error: "topic and keyword are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const tone = body.tone || "Friendly";
  const wordCount = Math.min(3000, Math.max(900, Number(body.wordCount) || 1200));
  const audience = body.audience || "South African resellers, print shops and small business owners";
  const intent = body.intent || "Informational";
  const includeFaq = body.includeFaq !== false;
  const includeInternalLinks = body.includeInternalLinks !== false;

  const prompt = `You are the senior SEO content strategist and writer for Blank2Branded, a South African DTF printing, blank apparel and promotional products business based in Mbombela/Mpumalanga and serving customers nationwide.

Create a genuinely useful article that satisfies search intent rather than keyword stuffing.

TOPIC: ${topic}
PRIMARY KEYWORD: ${keyword}
SEARCH INTENT: ${intent}
TONE: ${tone}
AUDIENCE: ${audience}
TARGET LENGTH: ${wordCount} words

SEO/content rules:
- Use en-ZA spelling and South African context where relevant.
- Be specific and practical. Do not invent prices, certifications, guarantees, statistics, suppliers or product specifications.
- Use the primary keyword naturally; never force it into every heading.
- Create a compelling 40-70 character title and a 30-60 character meta title containing the primary keyword.
- Create a 120-160 character meta description containing the primary keyword and a natural CTA.
- Create a clean lowercase URL slug.
- Use a clear H2/H3 structure, lists where useful, and a helpful conclusion.
- Include a soft CTA to a relevant Blank2Branded page.
- Only use the internal URLs supplied below. Never invent routes.
- ${includeFaq ? "Include 4-6 useful FAQs with concise answers." : "Return an empty FAQ array."}
- Return clean HTML for content using only p, h2, h3, ul, ol, li, strong, em, a. Do not include h1, html, body or script tags.
- If you include links, use the exact URLs from the allowed list.

Allowed internal URLs:
${INTERNAL_LINKS.map((x) => `${x.url} — ${x.label}`).join("\n")}

Return VALID JSON ONLY with exactly this shape:
{
  "title": "",
  "meta_title": "",
  "meta_description": "",
  "slug": "",
  "excerpt": "",
  "primary_keyword": "",
  "secondary_keywords": [""],
  "search_intent": "",
  "suggested_tags": [""],
  "internal_links": [{"label":"","url":"","reason":""}],
  "featured_image_prompt": "",
  "featured_image_alt": "",
  "faq": [{"question":"","answer":""}],
  "content": ""
}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [
      { role: "system", content: "You are an expert SEO content strategist. Always output valid JSON only." },
      { role: "user", content: prompt },
    ] }),
  });

  if (resp.status === 429) return new Response(JSON.stringify({ error: "AI rate limit hit — please retry in a moment" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted — please top up in workspace billing" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!resp.ok) {
    const text = await resp.text();
    return new Response(JSON.stringify({ error: `AI gateway error: ${resp.status} ${text}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const data = await resp.json();
  const cleaned = stripFences(String(data?.choices?.[0]?.message?.content ?? ""));
  let parsed: any;
  try { parsed = JSON.parse(cleaned); }
  catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return new Response(JSON.stringify({ error: "AI returned non-JSON output" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try { parsed = JSON.parse(match[0]); } catch { return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  }

  const allowed = new Set(INTERNAL_LINKS.map((x) => x.url));
  const links = Array.isArray(parsed.internal_links) && includeInternalLinks
    ? parsed.internal_links.filter((x: any) => x && allowed.has(String(x.url))).slice(0, 6).map((x: any) => ({ label: String(x.label || "").trim(), url: String(x.url), reason: String(x.reason || "").trim() }))
    : [];

  const result = {
    title: String(parsed.title ?? "").trim(),
    meta_title: String(parsed.meta_title ?? parsed.title ?? "").trim().slice(0, 70),
    meta_description: String(parsed.meta_description ?? "").trim().slice(0, 160),
    slug: slugify(String(parsed.slug ?? parsed.title ?? topic)),
    excerpt: String(parsed.excerpt ?? "").trim().slice(0, 300),
    primary_keyword: keyword,
    secondary_keywords: Array.isArray(parsed.secondary_keywords) ? parsed.secondary_keywords.map(String).map((x: string) => x.trim()).filter(Boolean).slice(0, 12) : [],
    search_intent: String(parsed.search_intent ?? intent).trim(),
    suggested_tags: Array.isArray(parsed.suggested_tags) ? parsed.suggested_tags.map(String).map((x: string) => x.trim()).filter(Boolean).slice(0, 10) : [],
    internal_links: links,
    featured_image_prompt: String(parsed.featured_image_prompt ?? `Professional South African business image illustrating ${topic}, clean modern commercial photography, no text overlay`).trim(),
    featured_image_alt: String(parsed.featured_image_alt ?? topic).trim().slice(0, 160),
    faq: includeFaq && Array.isArray(parsed.faq) ? parsed.faq.slice(0, 6).map((x: any) => ({ question: String(x.question || "").trim(), answer: String(x.answer || "").trim() })).filter((x: any) => x.question && x.answer) : [],
    content: String(parsed.content ?? "").trim(),
  };

  return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
