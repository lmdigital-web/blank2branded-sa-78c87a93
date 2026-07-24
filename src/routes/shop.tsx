import { Link } from "@/lib/static-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import shopHeroBg from "@/assets/shop-hero-bg.jpg";
import shopApparelImg from "@/assets/shop-apparel.jpg";
import shopCorporateImg from "@/assets/shop-corporate.jpg";
import {
  listPublishedProducts,
  listCategoryTree,
  listProductCategoryMap,
  type Collection,
} from "@/lib/catalog";

/* -------------------------------------------------------------------------- */
/*  Landing page — two collection blocks                                       */
/* -------------------------------------------------------------------------- */

export function ShopPage() {
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
          <p className="text-sm font-semibold uppercase tracking-wider text-magenta">Shop</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            What are you shopping for today?
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Pick a range below — browse blank apparel & DTF prints, or dive into our full corporate gifting and branding catalogue.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2">
          <CollectionCard
            to="/shop/apparel"
            eyebrow="Blanks & prints"
            title="Shop T-Shirts, Hoodies & Sweaters"
            description="Our original blank apparel range plus DTF transfers — ready to print, press or resell."
            image={shopApparelImg}
            imageAlt="Stack of blank t-shirts, hoodies and a sweater"
          />
          <CollectionCard
            to="/shop/corporate"
            eyebrow="Corporate & gifting"
            title="Shop Corporate Gifts, Clothing & Branding"
            description="Bags, drinkware, workwear, headwear, chef wear, display and more — with branding options at checkout."
            image={shopCorporateImg}
            imageAlt="Branded corporate gifts including a bottle, notebook, cap and mugs"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CollectionCard({
  to, eyebrow, title, description, image, imageAlt,
}: {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          width={1280}
          height={960}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
          {eyebrow}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">{title}</h2>
        <p className="mt-3 flex-1 text-sm text-muted-foreground md:text-base">{description}</p>
        <span
          className={cn(
            "mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold",
            "text-primary-foreground shadow-sm transition-all group-hover:bg-primary/90 group-hover:shadow-lg group-hover:shadow-primary/20",
          )}
        >
          Browse range
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Collection page — filtered grid + sidebar                                  */
/* -------------------------------------------------------------------------- */

const COLLECTION_META: Record<Collection, { eyebrow: string; title: React.ReactNode; description: string }> = {
  apparel: {
    eyebrow: "T-Shirts, Hoodies & Sweaters",
    title: (
      <>
        <span className="text-gradient-dtf">Blanks.</span> Prints. Ready to ship.
      </>
    ),
    description: "Our core blank apparel range plus DTF transfers — courier nationwide from Mbombela.",
  },
  corporate: {
    eyebrow: "Corporate Gifts, Clothing & Branding",
    title: <>Corporate gifting, workwear & branded merch.</>,
    description: "Browse bags, drinkware, workwear, headwear, display and more — add branding at checkout.",
  },
};

export function ShopCollectionPage({ collection }: { collection: Collection }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const meta = COLLECTION_META[collection];

  const { data, isLoading } = useQuery({
    queryKey: ["shop-products", collection],
    queryFn: () => listPublishedProducts(collection),
  });

  const { data: categories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: () => listCategoryTree(),
  });

  const { data: catMap } = useQuery({
    queryKey: ["shop-product-category-map", collection],
    queryFn: () => listProductCategoryMap(collection),
  });

  // Only show top-level categories that actually contain products in this collection.
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
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-magenta uppercase tracking-wider">{meta.eyebrow}</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            {meta.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{meta.description}</p>
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

                <Link
                  to="/shop"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
                >
                  ← Back to shop
                </Link>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : !filtered || filtered.length === 0 ? (
                <div className="text-center py-24">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No products found</h2>
                  <p className="mt-2 text-muted-foreground">Try a different category, or check the other shop range.</p>
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
