// Generate a blog draft with Lovable AI Gateway (Gemini 3 Flash).
// Returns { title, meta_description, slug, excerpt, content } as JSON.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body = {
  topic: string;
  keyword: string;
  tone?: string;
  wordCount?: number;
  audience?: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function stripFences(text: string) {
  return text
    .replace(/^```(?:json|html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { topic, keyword, tone = "Friendly", wordCount = 900, audience = "" } = body;
  if (!topic?.trim() || !keyword?.trim()) {
    return new Response(JSON.stringify({ error: "topic and keyword are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const prompt = `You are an expert SEO content writer for Blank2Branded — a DTF printing and blank apparel supplier in South Africa (Mbombela / Mpumalanga, ships nationwide).

Write a complete blog post on the topic below.

Topic: ${topic}
Focus keyword (must appear in title, first paragraph, and 3-6 times naturally in body): ${keyword}
Tone: ${tone}
Target audience: ${audience || "South African resellers and small brand owners"}
Target word count: ${wordCount}

Requirements:
- Write for South African audience (ZAR pricing hints, local context where relevant, en-ZA spelling).
- Include a compelling H1 title (50-60 chars, contains focus keyword).
- Include a meta description (140-160 chars, contains focus keyword, ends with a call-to-action).
- Structure with 4-6 H2 subheadings and 1-2 H3s where useful.
- Include an intro paragraph, informative body, and a conclusion with a soft CTA to /shop or /dtf.
- Where natural, mention linking to /dtf, /blanks, /shop, /catalogues.
- Return VALID JSON ONLY (no code fences, no extra prose) with this exact shape:
{
  "title": "…",
  "meta_description": "…",
  "slug": "…",
  "excerpt": "…",
  "content": "<p>…</p><h2>…</h2><p>…</p>…"
}
- "content" must be clean HTML (p, h2, h3, ul, ol, li, strong, em, a). No <html>, <body>, <h1>, or <script> tags.
- "excerpt" is 1-2 plain-text sentences (max 200 chars) for the blog listing.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an expert SEO blog writer. Always output valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (resp.status === 429) {
    return new Response(JSON.stringify({ error: "AI rate limit hit — please retry in a moment" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (resp.status === 402) {
    return new Response(
      JSON.stringify({ error: "AI credits exhausted — please top up in workspace billing" }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!resp.ok) {
    const text = await resp.text();
    return new Response(JSON.stringify({ error: `AI gateway error: ${resp.status} ${text}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = stripFences(String(raw));

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to salvage a JSON object embedded in the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: "AI returned non-JSON output", raw: cleaned.slice(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    parsed = JSON.parse(match[0]);
  }

  const result = {
    title: String(parsed.title ?? "").trim(),
    meta_description: String(parsed.meta_description ?? "").trim().slice(0, 200),
    slug: slugify(String(parsed.slug ?? parsed.title ?? topic)),
    excerpt: String(parsed.excerpt ?? "").trim().slice(0, 300),
    content: String(parsed.content ?? "").trim(),
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
