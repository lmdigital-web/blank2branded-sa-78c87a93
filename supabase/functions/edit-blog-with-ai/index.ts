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
  seo?: {
    score?: number;
    words?: number;
    density?: number;
    checks?: Array<{
      id: string;
      label: string;
      pass: boolean;
      hint: string;
    }>;
  };
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
          "OPENAI_API_KEY is not configured in Supabase Edge Function Secrets.",
      },
      500,
    );
  }

  let body: Body;

  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body." },
      400,
    );
  }

  const instruction = String(body.instruction ?? "").trim();

  if (!instruction) {
    return jsonResponse(
      { error: "An instruction is required." },
      400,
    );
  }

  const seoChecks = Array.isArray(body.seo?.checks)
    ? body.seo.checks
        .map((check) => ({
          id: String(check.id ?? ""),
          label: String(check.label ?? ""),
          pass: Boolean(check.pass),
          hint: String(check.hint ?? ""),
        }))
        .filter((check) => check.id && check.label)
    : [];

  const failedChecks = seoChecks.filter((check) => !check.pass);

  const prompt = `
You are the AI editing assistant inside the Blank2Branded South African blog editor.

Your job is to edit the existing blog according to the user's instruction.

IMPORTANT:
- Modify the existing article rather than replacing it with an unrelated article.
- Preserve useful information that is already present.
- Do not invent facts, prices, certifications, guarantees, statistics, suppliers or product specifications.
- Use South African / en-ZA spelling and context where appropriate.
- Do not keyword-stuff.
- Improve the article naturally.
- If fixing SEO, prioritize readability and search intent.
- Return ONLY valid JSON.
- Do not use Markdown fences.

USER INSTRUCTION:
${instruction}

CURRENT BLOG:

TITLE:
${body.title}

SLUG:
${body.slug}

EXCERPT:
${body.excerpt}

FOCUS KEYWORDS:
${body.keywords}

META TITLE:
${body.meta_title}

META DESCRIPTION:
${body.meta_description}

ARTICLE HTML:
${body.content}

CURRENT SEO INFORMATION:

SEO SCORE:
${body.seo?.score ?? "unknown"}

WORD COUNT:
${body.seo?.words ?? "unknown"}

KEYWORD DENSITY:
${body.seo?.density ?? "unknown"}%

FAILED SEO CHECKS:
${JSON.stringify(failedChecks, null, 2)}

SEO RULES:
- Keyword density target is 0.5% to 2.5%.
- Avoid unnatural repetition of the focus keyword.
- Keep headings useful and descriptive.
- Keep the article genuinely helpful.
- Maintain or improve the existing structure.
- Internal links should only use valid Blank2Branded routes if adding them.
- Do not invent URLs.

ALLOWED INTERNAL ROUTES:
- /dtf
- /blanks
- /shop
- /catalogues
- /contact
- /blog

CONTENT HTML RULES:
Use only these HTML elements:
p, h2, h3, ul, ol, li, strong, em, a

Do not use:
- h1
- html
- body
- script
- iframe
- inline JavaScript

Return exactly this JSON structure:

{
  "changes_summary": [
    ""
  ],
  "title": "",
  "slug": "",
  "excerpt": "",
  "meta_title": "",
  "meta_description": "",
  "keywords": "",
  "content": ""
}

IMPORTANT FIELD RULE:

Return the COMPLETE resulting value for every field.

Do not return instructions such as:
"leave unchanged"
"same as before"
"no change"

If a field does not need changing, return its existing value exactly.

The content field must contain the COMPLETE article HTML after your changes.
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
                "You are a careful SEO blog editor. Return valid JSON only.",
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
          "OpenAI rate limit or quota reached.",
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
        raw: cleaned.slice(0, 1000),
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

    title: String(
      parsed.title ?? body.title,
    ).trim(),

    slug: String(
      parsed.slug ?? body.slug,
    ).trim(),

    excerpt: String(
      parsed.excerpt ?? body.excerpt,
    ).trim(),

    meta_title: String(
      parsed.meta_title ?? body.meta_title,
    ).trim(),

    meta_description: String(
      parsed.meta_description ??
        body.meta_description,
    ).trim(),

    keywords: String(
      parsed.keywords ?? body.keywords,
    ).trim(),

    content: String(
      parsed.content ?? body.content,
    ).trim(),
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