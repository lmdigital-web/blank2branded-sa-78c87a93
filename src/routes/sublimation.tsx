import {
  ArrowRight,
  BookOpen,
  Check,
  MessageCircle,
  Palette,
  Shirt,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const WHATSAPP_NUMBER = "27698384045";

const cataloguePages = [
  { page: 7, group: "Men's Tops", title: "Men's Golfer — Fitted Sleeve" },
  { page: 8, group: "Men's Tops", title: "Men's Golfer — Raglan Sleeve" },
  { page: 9, group: "Men's Tops", title: "Men's Ringer Golfer — Fitted Sleeve" },
  { page: 10, group: "Men's Tops", title: "Men's Ringer Golfer — Raglan Sleeve" },
  { page: 11, group: "Men's Tops", title: "Men's Tank Top" },
  { page: 12, group: "Men's Tops", title: "Men's Crew Neck T-Shirt — Fitted Sleeve" },
  { page: 13, group: "Men's Tops", title: "Men's Crew Neck T-Shirt — Raglan Sleeve" },
  { page: 14, group: "Men's Tops", title: "Men's Ringer Crew Neck — Fitted Sleeve" },
  { page: 15, group: "Men's Tops", title: "Men's Ringer Crew Neck — Raglan Sleeve" },
  { page: 16, group: "Men's Tops", title: "Men's V-Neck T-Shirt — Raglan Sleeve" },
  { page: 17, group: "Men's Tops", title: "Men's V-Neck T-Shirt — Fitted Sleeve" },
  { page: 18, group: "Men's Tops", title: "Men's Ringer V-Neck — Raglan Sleeve" },
  { page: 19, group: "Men's Tops", title: "Men's Ringer V-Neck — Fitted Sleeve" },
  { page: 20, group: "Men's Tops", title: "Men's Warm Up — 1/4 Zip" },
  { page: 21, group: "Men's Tops", title: "Men's Mandarin Collar 1/4 Zip Shirt — Fitted Sleeve" },
  { page: 22, group: "Men's Tops", title: "Men's Mandarin Collar 1/4 Zip Shirt — Raglan Sleeve" },
  { page: 23, group: "Men's Tops", title: "Unisex Sports Bib" },
  { page: 24, group: "Men's Tops", title: "Men's Rugby Jersey — Scoop Neck" },
  { page: 25, group: "Men's Tops", title: "Men's Rugby Jersey — Insert Collar" },
  { page: 26, group: "Men's Tops", title: "Men's Caddy Bib" },
  { page: 27, group: "Men's Tops", title: "Men's Cricket Pullover" },
  { page: 28, group: "Men's Tops", title: "Men's Sublimated Lounge Shirt" },
  { page: 29, group: "Men's Tops", title: "Men's Button Shirt — Sublimated Short Sleeve" },
  { page: 31, group: "Hooded T-Shirts", title: "Hooded T-Shirt — Full Dye-Sublimation" },
  { page: 32, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt — Raglan Sleeve" },
  { page: 33, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt — Fitted Sleeve" },
  { page: 34, group: "Hooded T-Shirts", title: "Hooded T-Shirt With Neck Warmer" },
  { page: 35, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt With Neck Warmer — Fitted Sleeve" },
  { page: 36, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt With Neck Warmer — Raglan Sleeve" },
  { page: 38, group: "Men's Bottoms", title: "Men's Cricket Pants" },
  { page: 39, group: "Men's Bottoms", title: "Men's Shorts" },
  { page: 40, group: "Men's Bottoms", title: "Men's Rugby Shorts — 4 Panel" },
  { page: 41, group: "Men's Bottoms", title: "Men's Rugby Shorts — 9 Panel" },
  { page: 42, group: "Men's Bottoms", title: "Men's Golf Shorts" },
  { page: 43, group: "Men's Bottoms", title: "Men's Athletic Shorts" },
  { page: 44, group: "Men's Bottoms", title: "Men's Briefs" },
  { page: 46, group: "Ladies' Tops", title: "Ladies' Crew Neck T-Shirt — Raglan Sleeve" },
  { page: 47, group: "Ladies' Tops", title: "Ladies' Crew Neck T-Shirt — Fitted Sleeve" },
  { page: 48, group: "Ladies' Tops", title: "Ladies' Ringer Crew Neck — Fitted Sleeve" },
  { page: 49, group: "Ladies' Tops", title: "Ladies' Ringer Crew Neck — Raglan Sleeve" },
  { page: 50, group: "Ladies' Tops", title: "Ladies' V-Neck T-Shirt — Fitted Sleeve" },
  { page: 51, group: "Ladies' Tops", title: "Ladies' V-Neck T-Shirt — Raglan Sleeve" },
  { page: 52, group: "Ladies' Tops", title: "Ladies' Ringer V-Neck — Fitted Sleeve" },
  { page: 53, group: "Ladies' Tops", title: "Ladies' Ringer V-Neck — Raglan Sleeve" },
  { page: 54, group: "Ladies' Tops", title: "Ladies' Golfer — Fitted Sleeve" },
  { page: 55, group: "Ladies' Tops", title: "Ladies' Golfer — Raglan Sleeve" },
  { page: 56, group: "Ladies' Tops", title: "Ladies' Ringer Golfer — Fitted Sleeve" },
  { page: 57, group: "Ladies' Tops", title: "Ladies' Ringer Golfer — Raglan Sleeve" },
  { page: 58, group: "Ladies' Tops", title: "Ladies' Sleeveless Golfer" },
  { page: 59, group: "Ladies' Tops", title: "Ladies' Tank Top" },
  { page: 60, group: "Ladies' Tops", title: "Ladies' Racer Back Vest" },
  { page: 61, group: "Ladies' Tops", title: "Ladies' V-Neck Vest" },
  { page: 62, group: "Ladies' Tops", title: "Ladies' Crew Neck Vest" },
  { page: 63, group: "Ladies' Tops", title: "Ladies' Crop Top — Running Top" },
  { page: 64, group: "Ladies' Tops", title: "Ladies' Ringer Sleeveless Golfer Dress" },
  { page: 65, group: "Ladies' Tops", title: "Ladies' Sport Dress" },
  { page: 66, group: "Ladies' Tops", title: "Ladies' Warm Up — 1/4 Zip" },
  { page: 68, group: "Ladies' Bottoms", title: "Ladies' Skirt" },
  { page: 69, group: "Ladies' Bottoms", title: "Ladies' Skort" },
  { page: 70, group: "Ladies' Bottoms", title: "Ladies' Compression Shorts" },
  { page: 71, group: "Ladies' Bottoms", title: "Ladies' Hot Pants" },
  { page: 72, group: "Ladies' Bottoms", title: "Ladies' Tights — Knee Length" },
  { page: 73, group: "Ladies' Bottoms", title: "Ladies' Tights — 3/4 Length" },
  { page: 74, group: "Ladies' Bottoms", title: "Ladies' Tights — Full Length" },
  { page: 75, group: "Accessories", title: "Unisex Arm Sleeve" },
] as const;

const groups = [
  { id: "mens-tops", title: "Men's Tops", description: "Catalogue pages 7–29." },
  { id: "hooded", title: "Hooded T-Shirts", description: "Catalogue pages 31–36." },
  { id: "mens-bottoms", title: "Men's Bottoms", description: "Catalogue pages 38–44." },
  { id: "ladies-tops", title: "Ladies' Tops", description: "Catalogue pages 46–66." },
  { id: "ladies-bottoms", title: "Ladies' Bottoms", description: "Catalogue pages 68–74." },
  { id: "accessories", title: "Accessories", description: "Catalogue page 75." },
];

const materialOptions = [
  "Reverse Birdseye 140G",
  "Birdseye 140G",
  "Sport Tec 140G",
  "Drop Needle Square 130G",
];

const quoteLink = (product?: string) => {
  const message = product
    ? `Hi, I would like a quote for Dye Sublimation ${product}.`
    : "Hi, I would like a quote for custom Dye Sublimation apparel.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

function CataloguePageCard({ page }: { page: (typeof cataloguePages)[number] }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <a
        href={`/sublimation-catalogue/pages/page-${page.page}.webp`}
        target="_blank"
        rel="noreferrer"
        className="block bg-muted"
        aria-label={`Open ${page.title}, catalogue page ${page.page}`}
      >
        <div className="relative aspect-[595/842] overflow-hidden">
          <img
            src={`/sublimation-catalogue/pages/page-${page.page}.webp`}
            alt={`${page.title} —  Dye Sublimation Catalogue 2025, page ${page.page}`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <span className="absolute right-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            p. {page.page}
          </span>
        </div>
      </a>

      <div className="p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {page.group}
        </p>
        <h3 className="text-lg font-bold leading-tight text-charcoal">{page.title}</h3>
        <div className="mt-4">
          <a
            href={quoteLink(page.title)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Quote
          </a>
        </div>
      </div>
    </article>
  );
}

export function SublimationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-[560px] overflow-hidden bg-black">
        <img
          src="/sublimation-catalogue/cover.webp"
          alt="Dye Sublimation Catalogue cover"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[2px]"
        />
        <div className="absolute inset-0 bg-background/40" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" aria-hidden="true" />

        <Header />

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-start px-6 pb-20 pt-40 lg:px-8">
          <div className="max-w-4xl text-charcoal">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white/75 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
               Dye Sublimation Catalogue 2025
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-charcoal sm:text-5xl lg:text-7xl">
              Custom Dye Sublimation Apparel
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-charcoal/80 sm:text-xl">
              Browse the actual product pages from the  Dye Sublimation Catalogue 2025.
              No substitute product artwork — the catalogue pages below are the reference material.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#catalogue"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                Browse the catalogue
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href={quoteLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white/75 px-6 py-3.5 font-bold text-charcoal backdrop-blur transition hover:bg-white"
              >
                <MessageCircle className="h-5 w-5" />
                Request a quote
              </a>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="border-b border-border bg-background py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <BookOpen className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-xl font-bold text-charcoal">The actual catalogue</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Each product card uses a page rendered directly from the supplied 2025 catalogue.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Palette className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-xl font-bold text-charcoal">Custom designs</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The catalogue notes that garments are produced using client-approved designs.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Trophy className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-xl font-bold text-charcoal">Sport & lifestyle</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The range covers tops, hooded styles, bottoms and accessories across the catalogue sections.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Catalogue materials</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Material options shown throughout the range
              </h2>
              <p className="mt-4 text-muted-foreground">
                The catalogue uses several material specifications depending on the garment. The options below are among the core materials shown across the range.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {materialOptions.map((material) => (
                <div key={material} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-semibold text-charcoal">{material}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="catalogue" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Dye Sublimation Catalogue 2025</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-5xl">
                Browse the catalogue pages
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Every image below is a rendered page from the supplied dye sublimation catalogue. Open any page for a larger view of the original product imagery, specifications and sizing.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {groups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-primary hover:text-primary"
                >
                  {group.title}
                </a>
              ))}
            </div>

            <div className="mt-16 space-y-20">
              {groups.map((group) => {
                const pages = cataloguePages.filter((item) => {
                  if (group.id === "mens-tops") return item.page >= 7 && item.page <= 29;
                  if (group.id === "hooded") return item.page >= 31 && item.page <= 36;
                  if (group.id === "mens-bottoms") return item.page >= 38 && item.page <= 44;
                  if (group.id === "ladies-tops") return item.page >= 46 && item.page <= 66;
                  if (group.id === "ladies-bottoms") return item.page >= 68 && item.page <= 74;
                  return item.page === 75;
                });

                return (
                  <section key={group.id} id={group.id} className="scroll-mt-20">
                    <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">{group.description}</p>
                        <h3 className="mt-1 text-3xl font-black text-charcoal">{group.title}</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Shirt className="h-4 w-4" />
                        {pages.length} catalogue {pages.length === 1 ? "page" : "pages"}
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {pages.map((page) => (
                        <CataloguePageCard key={page.page} page={page} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-charcoal py-16 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">Ready to order?</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Tell us which catalogue style you want quoted.</h2>
              <p className="mt-4 leading-7 text-white/70">
                Send us the catalogue page or product name and we can take it from there.
              </p>
            </div>
            <a
              href={quoteLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 font-bold text-primary-foreground transition hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5" />
              Request a quote
            </a>
          </div>
        </section>

        <section className="border-t border-border bg-background py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-sm leading-6 text-muted-foreground">
              Product imagery and specifications are reproduced from the dye sublimation catalogue supplied for this website. Images are illustrative, actual products may vary, and designs shown are visual references only; garments are produced using client-approved designs.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SublimationPage;
