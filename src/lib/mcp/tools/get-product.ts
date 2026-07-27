import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description:
    "Get one shop product by handle, including its variants (colour/size, price, stock) and branding options (method, position, size, per-unit and setup pricing).",
  inputSchema: {
    handle: z.string().trim().describe("The product handle, e.g. 'unisex-dry-fit-t-shirt'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ handle }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;
    const supabase = supabaseForUser(ctx);

    const { data: product, error } = await supabase
      .from("shop_products")
      .select(
        "id,title,handle,brand,description,product_features,collection,status,base_price,currency_code,meta_title,meta_description",
      )
      .eq("handle", handle)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!product) return errorResult(`No product found with handle '${handle}'.`);

    const [{ data: variants }, { data: branding }] = await Promise.all([
      supabase
        .from("shop_product_variants")
        .select("id,sku,option1_name,option1_value,option2_name,option2_value,price,stock,available")
        .eq("product_id", product.id)
        .order("position"),
      supabase.from("shop_product_branding_options").select("*").eq("product_id", product.id),
    ]);

    const result = { product, variants: variants ?? [], branding_options: branding ?? [] };
    return textResult(result, result);
  },
});
