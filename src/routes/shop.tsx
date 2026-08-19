import { Link } from "@/lib/static-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import shopHeroBg from "@/assets/shop-hero-bg.jpg";
import { listProductCards, listCategoryTree } from "@/lib/catalog";

/* -------------------------------------------------------------------------- */
/*  Shop page — full product grid with category sidebar                        */
/* -------------------------------------------------------------------------- */

export function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "title">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["shop-product-cards", "all"],
    queryFn: () => listProductCards(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: () => listCategoryTree(),
    staleTime: 30 * 60 * 1000,
  });

  // Category ids come back with the product cards — no extra round trip.
  const catMap = useMemo(() => {
    if (!data) return undefined;
    const out: Record<string, string | null> = {};
    for (const p of data) out[p.id] = p.categoryId;
    return out;
  }, [data]);

  const topLevel = useMemo(() => {
    const all = (categories ?? []).filter((c) => !c.parent_id);
    const usedRoots = new Set<string>();
    if (categories && catMap) {
      const parentById = new Map((categories ?? []).map((c) => [c.id, c]));
      for (const cid of Object.values(catMap)) {
        if (!cid) continue;
        let node = parentById.get(cid);
        while (node?.parent_id) node = parentById.get(node.parent_id);
        if (node) usedRoots.add(node.id);
      }
    }
    return all.filter((c) => usedRoots.has(c.id));
  }, [categories, catMap]);

  const descendantMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const t of topLevel) m.set(t.id, new Set([t.id]));
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
    let list = data;
    if (activeCategory) {
      const ids = descendantMap.get(activeCategory) || new Set([activeCategory]);
      list = list.filter((p) => (p.categoryId ? ids.has(p.categoryId) : false));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      const terms = q.split(/\s+/);
      list = list.filter((p) => {
        const hay = `${p.title} ${p.handle}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }
    if (sort !== "featured") {
      const price = (p: (typeof list)[number]) => p.minPrice || 0;
      list = [...list].sort((a, b) =>
        sort === "price-asc"
          ? price(a) - price(b)
          : sort === "price-desc"
            ? price(b) - price(a)
            : a.title.localeCompare(b.title),
      );
    }
    return list;
  }, [data, activeCategory, descendantMap, catMap, search, inStockOnly, sort]);


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <img src={shopHeroBg} alt="" aria-hidden="true" className="h-full w-full scale-105 object-cover blur-[2px]" />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-magenta blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-cyan blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Shop</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            Blanks, prints & branded merch.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Browse our full range — blank apparel, DTF transfers, corporate gifts, workwear and more. Courier nationwide from Mbombela.
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
                    const subCats = (categories ?? []).filter(c => c.parent_id === cat.id);
                    
                    return (
                      <div key={cat.id} className="flex flex-col gap-1">
                        <button
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
                        
                        {(isActive || subCats.some(sc => activeCategory === sc.id)) && subCats.length > 0 && (
                          <div className="ml-4 flex flex-col gap-1 border-l-2 border-border/50 pl-2">
                            {subCats.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setActiveCategory(sub.id)}
                                className={cn(
                                  "w-full rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors",
                                  activeCategory === sub.id
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                                )}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                <p className="mb-2 mt-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Search</p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    aria-label="Search products"
                    className="pl-9 pr-9"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Filters</p>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  In stock only
                </label>

                <label className="mt-4 block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sort by</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="title">Name: A–Z</option>
                  </select>
                </label>

                {(search || inStockOnly || sort !== "featured" || activeCategory) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      setSearch("");
                      setInStockOnly(false);
                      setSort("featured");
                      setActiveCategory(null);
                    }}
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {!isLoading && (
                <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
                  {filtered.length} product{filtered.length === 1 ? "" : "s"}
                  {search && <> for “{search}”</>}
                </p>
              )}

              {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : !filtered || filtered.length === 0 ? (
                <div className="text-center py-24">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No products found</h2>
                  <p className="mt-2 text-muted-foreground">Try a different category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p, i) => {
                    return (
                      <Link
                        key={p.id}
                        to="/products/$handle"
                        params={{ handle: p.handle }}
                        className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
                      >
                        <div className="aspect-square bg-muted overflow-hidden">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.imageAlt ?? p.title}
                              loading={i < 6 ? "eager" : "lazy"}
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ShoppingBag /></div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground line-clamp-1">{p.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">From {p.currencyCode} {p.minPrice.toFixed(2)}</p>
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
    </main>
  );
}
