import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body = {
  instruction: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  author_name?: string | null;
  author_credentials?: string | null;
  experience_notes?: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function stripFences(text: string) {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  const key = Deno.env.get("OPENAI_API_KEY");

  if (!key) {
    return jsonResponse(
      {
        error:
          "OPENAI_API_KEY is not configured in Supabase Edge Function Secrets",
      },
      500,
    );
  }

  let body: Body;

  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON body",
      },
      400,
    );
  }

  const instruction = cleanText(body.instruction);

  if (!instruction) {
    return jsonResponse(
      {
        error: "instruction is required",
      },
      400,
    );
  }

  const title = cleanText(body.title);
  const slug = cleanText(body.slug);
  const excerpt = cleanText(body.excerpt);
  const content = cleanText(body.content);
  const metaTitle = cleanText(body.meta_title);
  const metaDescription = cleanText(body.meta_description);
  const keywords = cleanText(body.keywords);
  const authorName = cleanText(body.author_name);
  const authorCredentials = cleanText(body.author_credentials);
  const experienceNotes = cleanText(body.experience_notes);

  const prompt = `
You are the senior SEO editor for Blank2Branded, a South African DTF printing, blank apparel and promotional products business based in Mbombela/Mpumalanga and serving customers nationwide.

You are editing an existing blog post.

The user's editing instruction is:

${instruction}

CURRENT ARTICLE DATA

TITLE:
${title}

SLUG:
${slug}

EXCERPT:
${excerpt}

META TITLE:
${metaTitle}

META DESCRIPTION:
${metaDescription}

KEYWORDS:
${keywords}

AUTHOR:
${authorName}

AUTHOR CREDENTIALS:
${authorCredentials}

EXPERIENCE / INFORMATION GAIN NOTES:
${experienceNotes}

CURRENT HTML CONTENT:
${content}

EDITORIAL RULES:

1. Follow the user's editing instruction carefully.
2. Preserve useful factual information from the existing article unless the instruction requires changing it.
3. Do not invent prices, statistics, certifications, guarantees, suppliers, product specifications, customer results, or other unsupported facts.
4. Improve usefulness, clarity, structure and search intent where appropriate.
5. Use natural South African English / en-ZA spelling.
6. Do not keyword stuff.
7. Keep the primary keyword naturally represented in the title, metadata and content when appropriate.
8. Do not remove useful internal links unless the user's instruction requires it.
9. Do not invent new internal URLs.
10. Preserve existing valid links where possible.
11. Keep HTML clean.
12. Content may ONLY use these HTML tags:

p, h2, h3, ul, ol, li, strong, em, a

13. Do not use:
h1, html, body, script, style, iframe, tables, forms or other HTML elements.
14. Do not wrap the content in Markdown.
15. Do not return Markdown code fences.
16. The article should remain suitable for publication on Blank2Branded.
17. Make the requested changes rather than merely describing what should be changed.
18. Return the complete updated article content, not only the changed section.
19. If the user's instruction asks for SEO improvement, improve SEO without making the writing unnatural.
20. If the user's instruction asks to shorten the article, actually shorten it.
21. If the user's instruction asks to expand the article, add genuinely useful information rather than repetition.
22. If the user's instruction asks to rewrite the article, rewrite the complete article while preserving its useful factual basis.
23. Keep the slug clean and lowercase.
24. Keep meta title reasonably concise, ideally 30-60 characters.
25. Keep meta description reasonably concise, ideally 120-160 characters.
26. Keep the excerpt useful and suitable for a blog listing page.

Return VALID JSON ONLY.

Use exactly this structure:

{
  "changes_summary": [
    "short description of change"
  ],
  "title": "",
  "slug": "",
  "excerpt": "",
  "meta_title": "",
  "meta_description": "",
  "keywords": "",
  "content": ""
}

The changes_summary should contain no more than 12 concise items.
`;

  let response: Response;

  try {
    response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert SEO editor. Always return valid JSON only. Never use Markdown fences.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
      },
    );
  } catch (error) {
    return jsonResponse(
      {
        error: `Unable to connect to OpenAI: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      },
      500,
    );
  }

  if (response.status === 401) {
    return jsonResponse(
      {
        error:
          "OpenAI authentication failed. Check OPENAI_API_KEY in Supabase Edge Function Secrets.",
      },
      500,
    );
  }

  if (response.status === 429) {
    const details = await response.text();

    return jsonResponse(
      {
        error:
          "OpenAI rate limit or quota reached. Check your OpenAI account billing/usage.",
        details,
      },
      429,
    );
  }

  if (!response.ok) {
    const details = await response.text();

    return jsonResponse(
      {
        error:
          `OpenAI API error: ${response.status}`,
        details,
      },
      500,
    );
  }

  let data: any;

  try {
    data = await response.json();
  } catch {
    return jsonResponse(
      {
        error: "OpenAI returned an invalid response.",
      },
      500,
    );
  }

  const rawContent = String(
    data?.choices?.[0]?.message?.content ?? "",
  );

  const cleaned = stripFences(rawContent);

  if (!cleaned) {
    return jsonResponse(
      {
        error: "OpenAI returned an empty response.",
      },
      500,
    );
  }

  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return jsonResponse(
      {
        error: "OpenAI returned invalid JSON.",
        raw: cleaned.slice(0, 2000),
      },
      500,
    );
  }

  const result = {
    changes_summary:
      Array.isArray(parsed.changes_summary)
        ? parsed.changes_summary
            .map(String)
            .map((x: string) => x.trim())
            .filter(Boolean)
            .slice(0, 12)
        : [],

    title: cleanText(
      parsed.title,
      body.title,
    ),

    slug: cleanText(
      parsed.slug,
      body.slug,
    )
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80),

    excerpt: cleanText(
      parsed.excerpt,
      body.excerpt,
    ),

    meta_title: cleanText(
      parsed.meta_title,
      body.meta_title,
    ),

    meta_description: cleanText(
      parsed.meta_description,
      body.meta_description,
    ),

    keywords: cleanText(
      parsed.keywords,
      body.keywords,
    ),

    content: cleanText(
      parsed.content,
      body.content,
    ),
  };

  if (!result.content) {
    return jsonResponse(
      {
        error: "AI returned empty article content.",
      },
      500,
    );
  }

  return jsonResponse(result);
});