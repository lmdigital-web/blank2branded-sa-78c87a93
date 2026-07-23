import { Link } from "@/lib/static-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import shopHeroBg from "@/assets/shop-hero-bg.jpg";
import { listPublishedProducts, listCategoryTree, listProductCategoryMap } from "@/lib/catalog";

export function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: () => listPublishedProducts(),
  });

  const { data: categories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: () => listCategoryTree(),
  });

  const { data: catMap } = useQuery({
    queryKey: ["shop-product-category-map"],
    queryFn: () => listProductCategoryMap(),
  });

  // Only show top-level categories in the sidebar (children collapse into parents).
  const topLevel = useMemo(
    () => (categories ?? []).filter((c) => !c.parent_id),
    [categories],
  );

  // For each top-level category, collect its id plus all descendant ids.
  const descendantMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const t of topLevel) m.set(t.id, new Set([t.id]));
    // walk two levels deep, enough for parent -> children.
    for (const c of categories ?? []) {
      if (!c.parent_id) continue;
      if (m.has(c.parent_id)) m.get(c.parent_id)!.add(c.id);
    }
    return m;
  }, [topLevel, categories]);

  const countByCategory = useMemo(() => {
    const out = new Map<string, number>();
    if (!catMap) return out;
    for (const c of topLevel) {
      const ids = descendantMap.get(c.id) ?? new Set<string>();
      let n = 0;
      for (const [, cid] of Object.entries(catMap)) {
        if (cid && ids.has(cid)) n++;
      }
      out.set(c.id, n);
    }
    return out;
  }, [catMap, topLevel, descendantMap]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!activeCategory) return data;
    const ids = descendantMap.get(activeCategory) ?? new Set<string>();
    return data.filter((p) => {
      const cid = catMap?.[p.node.id];
      return cid ? ids.has(cid) : false;
    });
  }, [data, activeCategory, descendantMap, catMap]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <img src={shopHeroBg} alt="" aria-hidden="true" className="h-full w-full scale-105 object-cover blur-[2px]" />
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
            Browse our catalogue. Send an order on WhatsApp — nationwide shipping from Mbombela.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="lg:w-64 lg:shrink-0">
              <div className="lg:sticky lg:top-28">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Categories</p>
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2 text-left text-sm font-medium transition-colors",
                      activeCategory === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    All products
                    {data && <span className="ml-2 text-xs opacity-70">({data.length})</span>}
                  </button>
                  {topLevel.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2 text-left text-sm font-semibold transition-colors",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                        )}
                      >
                        {cat.name}
                        <span className="ml-2 text-xs opacity-70">({countByCategory.get(cat.id) ?? 0})</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : !filtered || filtered.length === 0 ? (
                <div className="text-center py-24">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No products found</h2>
                  <p className="mt-2 text-muted-foreground">Try a different category, or add products from the admin dashboard.</p>
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
