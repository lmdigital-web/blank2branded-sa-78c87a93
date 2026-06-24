import { Link } from "@/lib/static-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  fetchPublishedProducts,
  fetchCategoriesWithCounts,
  type CatalogueProduct,
  type CatalogueCategory,
} from "@/lib/catalogue";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import shopHeroBg from "@/assets/shop-hero-bg.jpg";

export function ShopPage() {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery<CatalogueProduct[]>({
    queryKey: ["catalogue-products"],
    queryFn: fetchPublishedProducts,
  });

  const { data: categories } = useQuery<CatalogueCategory[]>({
    queryKey: ["catalogue-categories"],
    queryFn: fetchCategoriesWithCounts,
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!activeCategorySlug) return products;
    return products.filter((p) => p.category?.slug === activeCategorySlug);
  }, [products, activeCategorySlug]);

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
            <span className="text-gradient-dtf">Blanks.</span> Prints. Quoted fast.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Browse our catalogue, build your cart and request a custom quote — our team responds within one business day.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="lg:w-64 lg:shrink-0">
              <div className="lg:sticky lg:top-28">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Categories
                </p>
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveCategorySlug(null)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2 text-left text-sm font-medium transition-colors",
                      activeCategorySlug === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    All products
                    {products && <span className="ml-2 text-xs opacity-70">({products.length})</span>}
                  </button>

                  {(categories ?? []).filter((c) => c.productCount > 0).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategorySlug(c.slug)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2 text-left text-sm font-semibold transition-colors",
                        activeCategorySlug === c.slug
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {c.name}
                      <span className="ml-2 text-xs opacity-70">({c.productCount})</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-24">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No products found</h2>
                  <p className="mt-2 text-muted-foreground">Try a different category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => {
                    const img = p.images[0];
                    return (
                      <Link
                        key={p.id}
                        to="/products/$handle"
                        params={{ handle: p.handle }}
                        className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
                      >
                        <div className="aspect-square bg-muted overflow-hidden">
                          {img ? (
                            <img
                              src={img.url}
                              alt={img.alt ?? p.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ShoppingBag />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground line-clamp-1">{p.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            From {p.price.currencyCode}{" "}
                            {parseFloat(p.price.amount).toFixed(2)}
                          </p>
                          <Button variant="outline" size="sm" className="mt-3 w-full">
                            View
                          </Button>
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
