import { Link } from "@/lib/static-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import shopHeroBg from "@/assets/shop-hero-bg.jpg";


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

// Only these top-level parents are surfaced. Apparel's children get flattened
// into top-level categories alongside DTF Prints.
const KEEP_PARENTS = ["Apparel", "DTF Prints"] as const;
const FLATTEN_PARENTS = new Set(["apparel"]);

const SPLIT_RE = /\s+[—\-/>]\s+/; // " — ", " - ", " / ", " > "

function splitTitle(title: string): { parent: string | null; child: string } {
  const parts = title.split(SPLIT_RE);
  if (parts.length >= 2) return { parent: parts[0].trim(), child: parts.slice(1).join(" — ").trim() };
  return { parent: null, child: title.trim() };
}

type CategoryItem = {
  key: string; // collection handle or `parent:Name`
  name: string;
  productIds: Set<string>;
};

export function ShopPage() {
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

  // Build a flat list: Apparel children become top-level entries; DTF Prints stays as-is.
  const categories = useMemo<CategoryItem[]>(() => {
    if (!collections) return [];

    const apparelChildren: CategoryItem[] = [];
    const otherKept = new Map<string, CategoryItem>(); // key -> item

    for (const c of collections) {
      const { parent, child } = splitTitle(c.node.title);
      const ids = new Set(c.node.products.edges.map((e) => e.node.id));

      if (parent && FLATTEN_PARENTS.has(parent.toLowerCase())) {
        apparelChildren.push({ key: c.node.handle, name: child, productIds: ids });
        continue;
      }

      // Standalone (no separator) collection that matches a kept parent name
      if (!parent) {
        const match = KEEP_PARENTS.find(
          (p) => p.toLowerCase() === c.node.title.toLowerCase(),
        );
        if (match) {
          const existing = otherKept.get(match.toLowerCase());
          if (existing) {
            ids.forEach((id) => existing.productIds.add(id));
          } else {
            otherKept.set(match.toLowerCase(), {
              key: c.node.handle,
              name: match,
              productIds: ids,
            });
          }
        }
        continue;
      }

      // "DTF Prints — Something" style: aggregate under the parent
      const keptParent = KEEP_PARENTS.find(
        (p) => p.toLowerCase() === parent.toLowerCase(),
      );
      if (keptParent) {
        const k = keptParent.toLowerCase();
        const existing = otherKept.get(k);
        if (existing) {
          ids.forEach((id) => existing.productIds.add(id));
        } else {
          otherKept.set(k, {
            key: `parent:${keptParent}`,
            name: keptParent,
            productIds: ids,
          });
        }
      }
    }

    apparelChildren.sort((a, b) => a.name.localeCompare(b.name));
    const dtf = otherKept.get("dtf prints");
    return dtf ? [...apparelChildren, dtf] : apparelChildren;
  }, [collections]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!activeCollection) return data;
    const cat = categories.find((c) => c.key === activeCollection);
    if (!cat) return data;
    return data.filter((p) => cat.productIds.has(p.node.id));
  }, [data, categories, activeCollection]);



  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={shopHeroBg}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover blur-[2px]"
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-magenta blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-cyan blur-3xl" />
          <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-lime blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-magenta">Shop</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">Blanks.</span> Prints. Ready to ship.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Browse our catalogue. Pick what you need. Checkout securely — nationwide shipping from Mbombela.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar */}
            <aside className="lg:w-64 lg:shrink-0">
              <div className="lg:sticky lg:top-28">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Categories
                </p>
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveCollection(null)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2 text-left text-sm font-medium transition-colors",
                      activeCollection === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    All products
                    {data && <span className="ml-2 text-xs opacity-70">({data.length})</span>}
                  </button>

                  {categories.map((cat) => {
                    const isActive = activeCollection === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCollection(cat.key)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2 text-left text-sm font-semibold transition-colors",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                        )}
                      >
                        {cat.name}
                        <span className="ml-2 text-xs opacity-70">({cat.productIds.size})</span>
                      </button>
                    );
                  })}
                </nav>

              </div>
            </aside>

            {/* Products grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : !filtered || filtered.length === 0 ? (
                <div className="text-center py-24">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No products found</h2>
                  <p className="mt-2 text-muted-foreground">Try a different category or add products to the store.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
