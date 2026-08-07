// Supabase-backed catalogue client. Returns objects shaped like the legacy
// Shopify types so the storefront and cart don't need to change.
import { supabase } from "@/integrations/supabase/client";
import type { ShopifyProduct, ShopifyVariant } from "@/lib/shopify";

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  position: number;
};

export type DbProductRow = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  status: "draft" | "published";
  base_price: number | null;
  currency_code: string;
  category_id: string | null;
  position: number;
  meta_title: string | null;
  meta_description: string | null;
  shop_product_variants: Array<{
    id: string;
    option1_name: string | null; option1_value: string | null;
    option2_name: string | null; option2_value: string | null;
    option3_name: string | null; option3_value: string | null;
    price: number;
    currency_code: string;
    sku: string | null;
    available: boolean;
    position: number;
  }>;
  shop_product_images: Array<{
    id: string;
    url: string;
    alt: string | null;
    position: number;
  }>;
};

function variantTitleFromRow(v: DbProductRow["shop_product_variants"][number]): string {
  return [v.option1_value, v.option2_value, v.option3_value].filter(Boolean).join(" / ") || "Default";
}

function selectedOptionsFromRow(v: DbProductRow["shop_product_variants"][number]) {
  const out: Array<{ name: string; value: string }> = [];
  if (v.option1_name && v.option1_value) out.push({ name: v.option1_name, value: v.option1_value });
  if (v.option2_name && v.option2_value) out.push({ name: v.option2_name, value: v.option2_value });
  if (v.option3_name && v.option3_value) out.push({ name: v.option3_name, value: v.option3_value });
  return out;
}

function optionsFromVariants(variants: DbProductRow["shop_product_variants"]) {
  const map = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const p of selectedOptionsFromRow(v)) {
      if (!map.has(p.name)) map.set(p.name, new Set());
      map.get(p.name)!.add(p.value);
    }
  }
  return [...map.entries()].map(([name, values]) => ({ name, values: [...values] }));
}

export function toShopifyShape(row: DbProductRow): ShopifyProduct & {
  node: ShopifyProduct["node"] & { descriptionHtml: string };
} {
  const variants = [...row.shop_product_variants].sort((a, b) => a.position - b.position);
  const images = [...row.shop_product_images].sort((a, b) => a.position - b.position);
  const currency = variants[0]?.currency_code ?? row.currency_code ?? "ZAR";
  const minPrice = variants.length
    ? Math.min(...variants.map((v) => v.price))
    : Number(row.base_price ?? 0);
  const shopifyVariants: ShopifyVariant[] = variants.length
    ? variants.map((v) => ({
        id: v.id,
        title: variantTitleFromRow(v),
        price: { amount: String(v.price), currencyCode: v.currency_code || currency },
        availableForSale: v.available,
        selectedOptions: selectedOptionsFromRow(v),
      }))
    : [
        {
          id: row.id,
          title: "Default",
          price: { amount: String(row.base_price ?? 0), currencyCode: currency },
          availableForSale: true,
          selectedOptions: [],
        },
      ];
  const description = row.description ?? "";
  return {
    node: {
      id: row.id,
      title: row.title,
      description,
      descriptionHtml: description,
      handle: row.handle,
      priceRange: { minVariantPrice: { amount: String(minPrice), currencyCode: currency } },
      images: {
        edges: images.length
          ? images.map((i) => ({ node: { url: i.url, altText: i.alt } }))
          : [],
      },
      variants: { edges: shopifyVariants.map((n) => ({ node: n })) },
      options: optionsFromVariants(variants),
    },
  };
}

const PRODUCT_SELECT = `
  id, title, handle, description, status, base_price, currency_code, category_id, position, meta_title, meta_description,
  shop_product_variants ( id, option1_name, option1_value, option2_name, option2_value, option3_name, option3_value, price, currency_code, sku, available, position ),
  shop_product_images ( id, url, alt, position )
`;

export type Collection = "apparel" | "corporate";

const PAGE_SIZE = 1000;

export async function listPublishedProducts(collection?: Collection) {
  const rows: DbProductRow[] = [];
  // PostgREST caps responses at 1000 rows — page through so the full
  // catalogue (2000+ products) loads instead of just the first page.
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("status", "published");
    if (collection) {
      query = query.in("collection", [collection, "both"]);
    }
    const { data, error } = await query
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data as unknown as DbProductRow[]) ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows.map(toShopifyShape);
}


export async function getProductByHandle(handle: string) {
  const { data, error } = await supabase
    .from("shop_products")
    .select(PRODUCT_SELECT)
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toShopifyShape(data as unknown as DbProductRow);
}

export async function listCategoryTree() {
  const { data, error } = await supabase
    .from("shop_categories")
    .select("id,name,slug,parent_id,position")
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as DbCategory[]) ?? [];
}

/* -------------------------------------------------------------------------- */
/*  Lightweight card listing for grid pages (shop, collections)                */
/* -------------------------------------------------------------------------- */

export type ProductCard = {
  id: string;
  title: string;
  handle: string;
  categoryId: string | null;
  currencyCode: string;
  minPrice: number;
  inStock: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

const CARD_SELECT = `
  id, title, handle, base_price, currency_code, category_id, position,
  shop_product_variants ( price, currency_code, available ),
  shop_product_images ( url, alt, position )
`;

type CardRow = {
  id: string;
  title: string;
  handle: string;
  base_price: number | null;
  currency_code: string;
  category_id: string | null;
  shop_product_variants: Array<{ price: number; currency_code: string; available: boolean }>;
  shop_product_images: Array<{ url: string; alt: string | null; position: number }>;
};

function cardFromRow(r: CardRow): ProductCard {
  const variants = r.shop_product_variants ?? [];
  const images = [...(r.shop_product_images ?? [])].sort((a, b) => a.position - b.position);
  return {
    id: r.id,
    title: r.title,
    handle: r.handle,
    categoryId: r.category_id,
    currencyCode: variants[0]?.currency_code || r.currency_code || "ZAR",
    minPrice: variants.length ? Math.min(...variants.map((v) => v.price)) : Number(r.base_price ?? 0),
    inStock: variants.length ? variants.some((v) => v.available) : true,
    imageUrl: images[0]?.url ?? null,
    imageAlt: images[0]?.alt ?? null,
  };
}

/**
 * Grid-friendly product list. Fetches only the columns the card needs and
 * pages in parallel — roughly 3x smaller and 3x faster than the full listing.
 */
export async function listProductCards(collection?: Collection): Promise<ProductCard[]> {
  const fetchPage = async (offset: number) => {
    let query = supabase.from("shop_products").select(CARD_SELECT).eq("status", "published");
    if (collection) query = query.in("collection", [collection, "both"]);
    const { data, error } = await query
      .order("position", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    return ((data ?? []) as unknown as CardRow[]).map(cardFromRow);
  };

  let countQuery = supabase
    .from("shop_products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (collection) countQuery = countQuery.in("collection", [collection, "both"]);
  const { count, error: countError } = await countQuery;
  if (countError) throw countError;

  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => fetchPage(i * PAGE_SIZE)),
  );
  return results.flat();
}

/** Map of product id -> category id (for the shop sidebar filter). */
export async function listProductCategoryMap(collection?: Collection): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("shop_products")
      .select("id,category_id")
      .eq("status", "published")
      .order("id", { ascending: true });
    if (collection) query = query.in("collection", [collection, "both"]);
    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{ id: string; category_id: string | null }>;
    for (const r of page) out[r.id] = r.category_id;
    if (page.length < PAGE_SIZE) break;
  }
  return out;
}
