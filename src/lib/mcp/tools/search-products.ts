import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search the Blank2Branded shop catalogue by title, handle or brand. Returns product title, handle, status, collection and base price.",
  inputSchema: {
    query: z.string().trim().describe("Text to match against product title, handle or brand.").optional(),
    collection: z.enum(["apparel", "corporate"]).describe("Limit to one collection.").optional(),
    status: z.enum(["active", "draft"]).describe("Filter by publish status.").optional(),
    limit: z.number().int().describe("Max results (default 20, max 100).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, collection, status, limit }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    let q = supabaseForUser(ctx)
      .from("shop_products")
      .select("id,title,handle,brand,collection,status,base_price,currency_code")
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));

    if (query) q = q.or(`title.ilike.%${query}%,handle.ilike.%${query}%,brand.ilike.%${query}%`);
    if (collection) q = q.eq("collection", collection);
    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult(data ?? [], { products: data ?? [] });
  },
});
