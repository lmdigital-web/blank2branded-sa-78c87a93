import {
  SHOPIFY_STOREFRONT_URL,
  SHOPIFY_STOREFRONT_TOKEN,
} from "@/lib/shopify";

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

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { fetchedAt: number; products: CatalogProduct[] } | null = null;
let inflight: Promise<CatalogProduct[]> | null = null;

const QUERY = `
  query AllProducts($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          description
          totalInventory
          availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 1) { edges { node { url altText } } }
        }
      }
    }
  }
`;

export async function fetchShopifyCatalog(force = false): Promise<CatalogProduct[]> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.products;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const all: CatalogProduct[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(SHOPIFY_STOREFRONT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query: QUERY, variables: { first: 100, cursor } }),
      });
      if (!res.ok) throw new Error(`Shopify ${res.status}`);
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message ?? "Shopify error");
      const page = json.data.products;
      for (const e of page.edges) {
        const n = e.node;
        all.push({
          id: n.id,
          handle: n.handle,
          title: n.title,
          description: n.description ?? "",
          price: n.priceRange.minVariantPrice.amount,
          currency: n.priceRange.minVariantPrice.currencyCode,
          image: n.images.edges[0]?.node?.url ?? null,
          availableForSale: n.availableForSale,
          totalInventory: n.totalInventory ?? null,
        });
      }
      if (!page.pageInfo.hasNextPage) break;
      cursor = page.pageInfo.endCursor;
    }
    cache = { fetchedAt: Date.now(), products: all };
    return all;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function fetchProductByHandle(handle: string): Promise<CatalogProduct | null> {
  const all = await fetchShopifyCatalog();
  return all.find((p) => p.handle === handle) ?? null;
}
