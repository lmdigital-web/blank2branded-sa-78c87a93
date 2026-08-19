import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExternalLink, BookOpen, MessageCircle } from "lucide-react";
import cataloguesHeroBg from "@/assets/catalogues-hero-bg.jpg";

const WA_NUMBER = "27698384045";

type Catalogue = {
  title: string;
  description: string;
  url: string;
  tag: string;
};

const CATALOGUES: Catalogue[] = [
  {
    title: "2026 Apparel & Workwear",
    tag: "Apparel & Workwear",
    description:
      "Corporate apparel, workwear, safety gear and uniforms — ready for print or embroidery.",
    url: "https://paznsaapp02.blob.core.windows.net/catalogues/2026-Apparel-Workwear-Catalogue/index.html",
  },
  {
    title: "2024 Sports & Headwear",
    tag: "Sports & Headwear",
    description:
      "Sportswear, team kits, caps, beanies and headwear for clubs, schools and promos.",
    url: "https://paznsaapp02.blob.core.windows.net/catalogues/2024-Sports-and-Headwear-Catalogue/index.html",
  },
  {
    title: "2026 Sublimation & Display",
    tag: "Sublimation & Display",
    description:
      "Full-colour sublimation kits, banners, flags, gazebos and event branding.",
    url: "https://paznsaapp02.blob.core.windows.net/catalogues/2026%20Sublimation%20Display%20catalogue/index.html",
  },
  {
    title: "2024 Gifts & Bags",
    tag: "Bags & Gifts",
    description:
      "Conference bags, backpacks, drinkware and lifestyle gifts for branded giveaways.",
    url: "https://paznsaapp02.blob.core.windows.net/catalogues/2024-Gifts-and-bags-Catalogue/index.html",
  },
];

export function CataloguesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={cataloguesHeroBg}
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
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Supplier Catalogues
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">Browse</span> our full ranges.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-charcoal/85">
            Open any catalogue below to view the full digital flipbook, then WhatsApp us the product codes you like and we'll come back with a quote within 4 business hours.
          </p>
          <div className="mt-8">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Blank2Branded, I'd like a quote on items from your catalogue.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              <MessageCircle className="h-4 w-4" />
              Quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* CATALOGUE CARDS */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATALOGUES.map((cat) => (
              <div
                key={cat.url}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {cat.tag}
                </p>
                <h2 className="mt-2 text-xl font-bold text-charcoal">{cat.title}</h2>
                <p className="mt-2 flex-1 text-sm text-charcoal/85">{cat.description}</p>
                <a
                  href={cat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-dtf px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-lg"
                >
                  Open Catalogue <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-charcoal">Found something you like?</h2>
          <p className="mt-2 text-charcoal/85">
            WhatsApp us the product code(s) from the catalogue and we'll send you a quote with branding options.
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Blank2Branded, I'd like a quote on items from your catalogue.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            <MessageCircle className="h-4 w-4" />
            Request a Quote on WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
