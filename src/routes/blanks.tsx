import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Shirt,
  UserRound,
  Flame,
  Sparkles,
  Baby,
  Wind,
  Briefcase,
  Download,
  ArrowRight,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/blanks")({
  head: () => ({
    meta: [
      { title: "Blank Apparel — DTF, Screen Print, Embroidery | Blank2Branded" },
      {
        name: "description",
        content:
          "Premium blank t-shirts, polos, hoodies, ladies and kids apparel. Ready for DTF, screen print or embroidery. Open to brands, businesses and individuals — minimum 5 pieces per order. Nationwide shipping from Mbombela.",
      },
      { property: "og:title", content: "Blank Apparel | Blank2Branded" },
      {
        property: "og:description",
        content:
          "Premium blanks ready for DTF, screen print or embroidery. Minimum 5 pieces per order. Nationwide shipping.",
      },
      { property: "og:url", content: "/blanks" },
    ],
    links: [{ rel: "canonical", href: "/blanks" }],
  }),
  component: BlanksPage,
});

// Color name → hex map for dot swatches
const COLOR_HEX: Record<string, string> = {
  White: "#ffffff",
  Black: "#0d0d0d",
  Navy: "#1a2540",
  Grey: "#8a8a8a",
  Granite: "#5b5f63",
  Melange: "#b8b4ac",
  Royal: "#1e4fb0",
  Sky: "#7ec8e3",
  "Midnight Blue": "#0f1b3d",
  Turquoise: "#1ec4c4",
  Bottle: "#0d4a2a",
  "Forest Green": "#1f4a2c",
  Emerald: "#0d9b5a",
  Olive: "#6b6a2b",
  Lime: "#b8d62a",
  Yellow: "#ffd400",
  Orange: "#ff7a1a",
  Red: "#d62318",
  "Flame Red": "#d62318",
  Maroon: "#5a1422",
  Brown: "#5b3a22",
  Stone: "#c9bda6",
  Purple: "#5b2a8a",
  "Hot Pink": "#e94e9b",
  "Baby Pink": "#f5c6d2",
  "Cool Mint": "#a8e0c8",
};

function ColorDots({ colors }: { colors: string[] }) {
  const visible = colors.slice(0, 8);
  const extra = colors.length - visible.length;
  return (
    <div className="flex items-center gap-1.5">
      {visible.map((c) => (
        <span
          key={c}
          title={c}
          className="inline-block h-3.5 w-3.5 rounded-full border border-border"
          style={{ backgroundColor: COLOR_HEX[c] ?? "#cccccc" }}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">
        {extra > 0 ? `${colors.length}+ colors` : `${colors.length} color${colors.length === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}

type Product = {
  name: string;
  spec: string;
  sizes: string;
  colors: string[];
};

const CATEGORIES: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; products: Product[] }[] = [
  {
    id: "t-shirts",
    label: "T-Shirts",
    icon: Shirt,
    products: [
      { name: "Lightweight 140g Crew Neck", spec: "140g | 100% Cotton", sizes: "S – 3XL", colors: ["White","Black","Navy","Grey","Royal","Sky","Bottle","Lime","Yellow","Orange","Red"] },
      { name: "Heavyweight 180g Crew Neck", spec: "180g | 100% Cotton", sizes: "S – 3XL", colors: ["White","Black","Navy","Royal","Turquoise","Purple","Hot Pink","Baby Pink","Brown","Stone","Olive","Emerald","Lime","Yellow","Orange","Red","Grey","Sky","Bottle","Maroon"] },
      { name: "Premium 220g Crew Neck", spec: "220g | 100% Cotton", sizes: "S – 3XL", colors: ["White","Black","Navy"] },
      { name: "Platinum 160g Crew Neck", spec: "160g | Combed Cotton", sizes: "S – 3XL", colors: ["White","Black","Midnight Blue","Forest Green","Flame Red","Granite","Melange"] },
      { name: "V-Neck 160g T-Shirt", spec: "160g | 100% Cotton", sizes: "S – 3XL", colors: ["White","Black","Navy","Red","Melange"] },
      { name: "Long Sleeve 180g", spec: "180g | 100% Cotton", sizes: "S – 3XL", colors: ["White","Black","Navy","Royal"] },
    ],
  },
  {
    id: "polos",
    label: "Polos",
    icon: UserRound,
    products: [
      { name: "Men's Polo 190g Pique Knit", spec: "190g | Pique Knit", sizes: "S – 3XL", colors: ["White","Black","Navy","Grey","Royal","Sky","Bottle","Lime","Stone","Baby Pink","Yellow","Orange","Red","Melange"] },
      { name: "Women's Polo 190g Pique Knit", spec: "190g | Pique Knit", sizes: "S – 3XL", colors: ["White","Black","Navy","Royal","Hot Pink"] },
      { name: "Dry-Fit Polo 140g", spec: "140g | Moisture-Wicking", sizes: "Unisex S – 3XL", colors: ["Black","White","Navy","Royal","Red"] },
      { name: "Women's Dry-Fit Polo 140g", spec: "140g | Moisture-Wicking", sizes: "XS – 2XL", colors: ["Black","White","Navy","Royal","Turquoise"] },
    ],
  },
  {
    id: "hoodies",
    label: "Hoodies & Sweats",
    icon: Flame,
    products: [
      { name: "Sweater 260g Unisex", spec: "260g | Fleece-Backed", sizes: "XS – 3XL", colors: ["Black","Navy","Melange"] },
      { name: "High Neck Sweater 260g", spec: "260g | Fleece-Backed", sizes: "XS – 3XL", colors: ["Black","Navy","Melange"] },
      { name: "Hoodie 260g Unisex", spec: "260g | Fleece-Backed", sizes: "XS – 3XL", colors: ["Black","White","Navy","Granite","Melange"] },
      { name: "Fleece Zip Hoodie 260g", spec: "260g | Full Zip", sizes: "XS – 3XL", colors: ["Black","Navy","Melange"] },
      { name: "Track Pants 260g", spec: "260g | Fleece-Backed", sizes: "XS – 5XL", colors: ["Black","Navy","Melange"] },
      { name: "Full Zip Jacket 260g", spec: "260g | Full Zip", sizes: "XS – 3XL", colors: ["Black","Navy","Melange"] },
    ],
  },
  {
    id: "ladies",
    label: "Ladies",
    icon: Sparkles,
    products: [
      { name: "Women's Fitted 160g Scoop Neck", spec: "160g | Fitted Cut", sizes: "XS – 2XL", colors: ["White","Black","Midnight Blue","Flame Red","Hot Pink","Cool Mint","Stone"] },
      { name: "Women's Racerback 160g", spec: "160g | Racerback Vest", sizes: "XS – 2XL", colors: ["White","Black","Navy","Red","Melange"] },
    ],
  },
  {
    id: "kids",
    label: "Kids",
    icon: Baby,
    products: [
      { name: "Kids Heavyweight 180g Crew", spec: "180g | 100% Cotton", sizes: "Ages 1 – 14", colors: ["White","Black","Navy","Royal","Turquoise","Sky","Grey","Purple","Hot Pink","Baby Pink","Brown","Stone","Olive","Bottle","Emerald","Lime","Yellow","Orange","Red","Maroon"] },
      { name: "Kids Long Sleeve 180g", spec: "180g | 100% Cotton", sizes: "Ages 1 – 14", colors: ["White","Black","Navy","Royal"] },
      { name: "Kids Hoodie 260g Fleece", spec: "260g | Fleece-Backed", sizes: "Ages 5 – 14", colors: ["Black","Navy","Melange"] },
      { name: "Kids Polo 190g Pique", spec: "190g | Pique Knit", sizes: "Ages 5 – 14", colors: ["White","Black","Navy","Royal","Red"] },
      { name: "Kids Dry-Fit Polo 140g", spec: "140g | Moisture-Wicking", sizes: "Ages 5 – 14", colors: ["Black","White","Navy","Royal"] },
    ],
  },
  {
    id: "vests",
    label: "Vests",
    icon: Wind,
    products: [
      { name: "Vest 160g", spec: "160g | 100% Cotton", sizes: "S – 3XL", colors: ["White","Black","Navy","Red","Melange"] },
    ],
  },
  {
    id: "jackets",
    label: "Jackets",
    icon: Briefcase,
    products: [
      { name: "Oxford Jacket", spec: "Water-Resistant Shell", sizes: "S – 3XL", colors: ["Black","Navy","Royal","Red","Bottle"] },
    ],
  },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-charcoal hover:shadow-lg">
      <div className="flex-1">
        <h3 className="text-base font-bold text-charcoal">{product.name}</h3>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">
          {product.spec}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-charcoal">Sizes:</span> {product.sizes}
        </p>
        <div className="mt-4">
          <ColorDots colors={product.colors} />
        </div>
      </div>
      <Link
        to="/contact"
        search={{ subject: `Quote: ${product.name}` }}
        className="mt-6 inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        Request Quote for This Style
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function BlanksPage() {
  const selectCls =
    "w-full appearance-none rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-charcoal transition-colors focus:border-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-magenta blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-cyan blur-3xl" />
          <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-lime blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-magenta">
            Catalogue
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">Blank</span> Apparel.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Premium blanks ready for DTF, screen print, or embroidery. Open to brands, businesses and individuals — minimum 5 pieces per order. Nationwide shipping from Mbombela.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/contact"
              search={{ subject: "Blanks Enquiry" }}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              Request a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal"
            >
              <Download className="h-4 w-4" /> Download Full Spec Sheet
            </a>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="sticky top-[65px] z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <select className={selectCls} aria-label="Category" defaultValue="">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id}>{c.label}</option>
              ))}
            </select>
            <select className={selectCls} aria-label="Fabric Weight" defaultValue="">
              <option value="">Any Fabric Weight</option>
              <option>140g</option>
              <option>160g</option>
              <option>180g</option>
              <option>190g</option>
              <option>220g</option>
              <option>260g</option>
            </select>
            <select className={selectCls} aria-label="Gender" defaultValue="">
              <option value="">All Genders</option>
              <option>Unisex</option>
              <option>Men</option>
              <option>Women</option>
              <option>Kids</option>
            </select>
            <select className={selectCls} aria-label="Size Range" defaultValue="">
              <option value="">All Size Ranges</option>
              <option>XS – 2XL</option>
              <option>S – 3XL</option>
              <option>XS – 5XL</option>
              <option>Ages 1 – 14</option>
            </select>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-charcoal px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-charcoal/90"
            >
              <Search className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES + GRID */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-6">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const palette = ["magenta", "cyan", "primary", "lime", "purple", "yellow"];
            const color = palette[idx % palette.length];
            return (
              <div key={cat.id} id={cat.id} className="scroll-mt-40">
                <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: `color-mix(in oklab, var(--${color}) 40%, var(--border))` }}>
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md"
                    style={{ backgroundColor: `var(--${color})`, boxShadow: `0 8px 24px -8px color-mix(in oklab, var(--${color}) 60%, transparent)` }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-charcoal">
                      {cat.label}
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: `var(--${color})` }}>
                      {cat.products.length} style{cat.products.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cat.products.map((p) => (
                    <ProductCard key={p.name} product={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative overflow-hidden border-y border-border bg-charcoal py-20 text-background">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-dtf" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-dtf" />
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-magenta blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Can't find the <span className="text-gradient-dtf">blank</span> you need?
          </h2>
          <p className="mt-4 text-lg text-background/70">
            We can source other styles. Minimums apply.
          </p>
          <Link
            to="/contact"
            search={{ subject: "Custom Blank Sourcing Enquiry" }}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.03]"
          >
            Contact Our Team <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* DISCLAIMER */}
      <div className="border-b border-border bg-background py-6">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            All garments are supplied blank. Minimum order of 5 pieces. Colors subject to availability. We recommend samples before bulk orders.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
