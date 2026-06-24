// Local product catalogue (replaces Shopify Storefront API).
// All shop data now lives in Supabase tables: shop_products, shop_product_variants,
// shop_product_images, shop_categories. Quote requests replace checkout.

import { supabase } from "@/integrations/supabase/client";

export interface CatalogueImage {
  url: string;
  alt: string | null;
}

export interface CatalogueVariant {
  id: string;
  title: string;
  available: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface CatalogueOption {
  name: string;
  values: string[];
}

export interface CatalogueCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
}

export interface CatalogueProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  status: "draft" | "published";
  category: { id: string; name: string; slug: string } | null;
  price: { amount: string; currencyCode: string };
  images: CatalogueImage[];
  variants: CatalogueVariant[];
  options: CatalogueOption[];
}

type Row = {
  id: string; handle: string; title: string; description: string | null;
  status: string; base_price: number | string | null; currency_code: string;
  category_id: string | null;
  shop_categories: { id: string; name: string; slug: string } | null;
  shop_product_images: Array<{ url: string; alt: string | null; position: number }>;
  shop_product_variants: Array<{
    id: string; price: number | string; currency_code: string; available: boolean;
    option1_name: string | null; option1_value: string | null;
    option2_name: string | null; option2_value: string | null;
    option3_name: string | null; option3_value: string | null;
    position: number;
  }>;
};

const SELECT =
  "id,handle,title,description,status,base_price,currency_code,category_id," +
  "shop_categories(id,name,slug)," +
  "shop_product_images(url,alt,position)," +
  "shop_product_variants(id,price,currency_code,available," +
  "option1_name,option1_value,option2_name,option2_value,option3_name,option3_value,position)";

function buildVariantTitle(v: Row["shop_product_variants"][number]): string {
  return [v.option1_value, v.option2_value, v.option3_value]
    .filter(Boolean)
    .join(" / ") || "Default";
}

function shape(row: Row, currency = "ZAR"): CatalogueProduct {
  const images = [...(row.shop_product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ url: i.url, alt: i.alt }));

  const variants = [...(row.shop_product_variants ?? [])]
    .sort((a, b) => a.position - b.position)
    .map<CatalogueVariant>((v) => {
      const selectedOptions: Array<{ name: string; value: string }> = [];
      if (v.option1_name && v.option1_value)
        selectedOptions.push({ name: v.option1_name, value: v.option1_value });
      if (v.option2_name && v.option2_value)
        selectedOptions.push({ name: v.option2_name, value: v.option2_value });
      if (v.option3_name && v.option3_value)
        selectedOptions.push({ name: v.option3_name, value: v.option3_value });
      return {
        id: v.id,
        title: buildVariantTitle(v),
        available: v.available,
        price: { amount: String(v.price), currencyCode: v.currency_code || currency },
        selectedOptions,
      };
    });

  // Derive options (preserve insertion order, dedupe values)
  const opts = new Map<string, string[]>();
  for (const v of variants) {
    for (const o of v.selectedOptions) {
      const list = opts.get(o.name) ?? [];
      if (!list.includes(o.value)) list.push(o.value);
      opts.set(o.name, list);
    }
  }
  const options = [...opts.entries()].map(([name, values]) => ({ name, values }));

  const basePrice =
    row.base_price != null
      ? String(row.base_price)
      : variants[0]?.price.amount ?? "0";

  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? "",
    status: (row.status as "draft" | "published") ?? "draft",
    category: row.shop_categories
      ? { id: row.shop_categories.id, name: row.shop_categories.name, slug: row.shop_categories.slug }
      : null,
    price: { amount: basePrice, currencyCode: row.currency_code || currency },
    images,
    variants,
    options,
  };
}

export async function fetchPublishedProducts(): Promise<CatalogueProduct[]> {
  const { data, error } = await supabase
    .from("shop_products")
    .select(SELECT)
    .eq("status", "published")
    .order("position", { ascending: true });
  if (error) {
    console.error("[catalogue] fetchPublishedProducts", error);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map((r) => shape(r));
}

export async function fetchProductByHandle(handle: string): Promise<CatalogueProduct | null> {
  const { data, error } = await supabase
    .from("shop_products")
    .select(SELECT)
    .eq("handle", handle)
    .maybeSingle();
  if (error) {
    console.error("[catalogue] fetchProductByHandle", error);
    return null;
  }
  return data ? shape(data as unknown as Row) : null;
}

export async function fetchCategoriesWithCounts(): Promise<CatalogueCategory[]> {
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("shop_categories").select("id,name,slug,position").order("position"),
    supabase.from("shop_products").select("category_id").eq("status", "published"),
  ]);
  const counts = new Map<string, number>();
  for (const p of prods ?? []) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  return (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: counts.get(c.id) ?? 0,
  }));
}
