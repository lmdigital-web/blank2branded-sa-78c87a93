import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_orders",
  title: "List orders",
  description:
    "List recent Blank2Branded orders visible to the signed-in user, with customer, totals, status and line items.",
  inputSchema: {
    status: z.string().trim().describe("Filter by order status, e.g. 'pending' or 'paid'.").optional(),
    limit: z.number().int().describe("Max orders to return (default 10, max 50).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    let q = supabaseForUser(ctx)
      .from("orders")
      .select(
        "id,order_number,created_at,status,customer_name,customer_email,customer_phone,subtotal,shipping_amount,total_amount,ship_city,ship_province,order_items(product_name,variant_label,quantity,unit_price,line_total)",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 10, 1), 50));
    if (status) q = q.eq("status", status as never);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult(data ?? [], { orders: data ?? [] });
  },
});
