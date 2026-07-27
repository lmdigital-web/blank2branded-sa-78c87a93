import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_blog_posts",
  title: "List blog posts",
  description:
    "List Blank2Branded blog posts with title, slug, status, publish date and SEO metadata. Use to review content or find a post to update.",
  inputSchema: {
    status: z.enum(["published", "scheduled", "draft"]).describe("Filter by post status.").optional(),
    query: z.string().trim().describe("Match against post title or slug.").optional(),
    limit: z.number().int().describe("Max posts to return (default 20, max 100).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, query, limit }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    let q = supabaseForUser(ctx)
      .from("posts")
      .select("id,title,slug,status,published_at,updated_at,excerpt,meta_title,meta_description,keywords")
      .order("updated_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status) q = q.eq("status", status);
    if (query) q = q.or(`title.ilike.%${query}%,slug.ilike.%${query}%`);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult(data ?? [], { posts: data ?? [] });
  },
});
