import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default defineTool({
  name: "create_blog_draft",
  title: "Create blog draft",
  description:
    "Create a new blog post in draft status (never published directly). Provide the title and HTML content, plus optional SEO fields.",
  inputSchema: {
    title: z.string().trim().describe("Post title."),
    content: z.string().describe("Post body as HTML."),
    excerpt: z.string().trim().describe("Short summary shown in listings.").optional(),
    slug: z.string().trim().describe("URL slug. Derived from the title when omitted.").optional(),
    meta_title: z.string().trim().describe("SEO title tag.").optional(),
    meta_description: z.string().trim().describe("SEO meta description.").optional(),
    keywords: z.string().trim().describe("Comma-separated focus keywords.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const slug = slugify(input.slug || input.title);
    if (!slug) return errorResult("Could not derive a valid slug from the title.");

    const { data, error } = await supabaseForUser(ctx)
      .from("posts")
      .insert({
        title: input.title,
        slug,
        content: input.content,
        excerpt: input.excerpt ?? null,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        keywords: input.keywords ?? null,
        status: "draft",
        created_by: ctx.getUserId(),
      })
      .select("id,title,slug,status")
      .single();

    if (error) return errorResult(error.message);
    return textResult(`Draft created: ${data.title} (/blog/${data.slug})`, { post: data });
  },
});
