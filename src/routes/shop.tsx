import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import shopHeroBg from "@/assets/shop-hero-bg.jpg";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Blank2Branded" },
      { name: "description", content: "Shop blank apparel, DTF transfers and branded gear from Blank2Branded." },
      { property: "og:title", content: "Shop — Blank2Branded" },
      { property: "og:description", content: "Shop blank apparel, DTF transfers and branded gear." },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: ShopPage,
});

const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          products(first: 100) { edges { node { id } } }
        }
      }
    }
  }
`;

const PRODUCTS_FULL_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id title description handle
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 20) {
            edges {
              node {
                id title availableForSale
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
          options { name values }
        }
      }
    }
  }
`;

type Collection = {
  node: {
    id: string;
    title: string;
    handle: string;
    products: { edges: Array<{ node: { id: string } }> };
  };
};

function ShopPage() {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: async () => {
      const d = await storefrontApiRequest(PRODUCTS_FULL_QUERY, { first: 50 });
      return (d?.data?.products?.edges ?? []) as ShopifyProduct[];
    },
  });

  const { data: collections } = useQuery({
    queryKey: ["shopify-collections"],
    queryFn: async () => {
      const d = await storefrontApiRequest(COLLECTIONS_QUERY, { first: 50 });
      return (d?.data?.collections?.edges ?? []) as Collection[];
    },
  });

  const filtered = (() => {
    if (!data) return [];
    if (!activeCollection) return data;
    const col = collections?.find((c) => c.node.handle === activeCollection);
    if (!col) return data;
    const ids = new Set(col.node.products.edges.map((e) => e.node.id));
    return data.filter((p) => ids.has(p.node.id));
  })();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Shop</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-foreground md:text-6xl">
            Blanks. Prints. Ready to ship.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse our catalogue. Pick what you need. Checkout securely.
          </p>
        </div>
      </section>

      {collections && collections.length > 0 && (
        <section className="border-b border-border bg-muted/30 py-6">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Collections
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCollection(null)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  activeCollection === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                All
              </button>
              {collections.map((c) => (
                <button
                  key={c.node.id}
                  onClick={() => setActiveCollection(c.node.handle)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    activeCollection === c.node.handle
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {c.node.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="text-center py-24">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No products found</h2>
              <p className="mt-2 text-muted-foreground">Try a different collection or add products to the store.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const img = p.node.images.edges[0]?.node;
                const price = p.node.priceRange.minVariantPrice;
                return (
                  <Link
                    key={p.node.id}
                    to="/products/$handle"
                    params={{ handle: p.node.handle }}
                    className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
                  >
                    <div className="aspect-square bg-muted overflow-hidden">
                      {img ? (
                        <img src={img.url} alt={img.altText ?? p.node.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{p.node.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">From {price.currencyCode} {parseFloat(price.amount).toFixed(2)}</p>
                      <Button variant="outline" size="sm" className="mt-3 w-full">View</Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
