// Catalogue helpers used by the blog product-card embed. Backed by Supabase
// (the storefront is no longer Shopify-driven).
import { getProductByHandle, listPublishedProducts } from "@/lib/catalog";

export interface CatalogProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  image: string | null;
  availableForSale: boolean;
  totalInventory: number | null;
}

function adapt(shaped: Awaited<ReturnType<typeof getProductByHandle>>): CatalogProduct | null {
  if (!shaped) return null;
  const n = shaped.node;
  const img = n.images.edges[0]?.node?.url ?? null;
  const price = n.priceRange.minVariantPrice;
  const available = n.variants.edges.some((v) => v.node.availableForSale);
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    description: n.description ?? "",
    price: price.amount,
    currency: price.currencyCode,
    image: img,
    availableForSale: available,
    totalInventory: null,
  };
}

export async function fetchShopifyCatalog(): Promise<CatalogProduct[]> {
  const all = await listPublishedProducts();
  return all.map((p) => adapt(p)!).filter(Boolean);
}

export async function fetchProductByHandle(handle: string): Promise<CatalogProduct | null> {
  return adapt(await getProductByHandle(handle));
}
