import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExternalLink, BookOpen } from "lucide-react";

type Catalogue = {
  title: string;
  description: string;
  url: string;
};

type CatalogueSection = {
  section: string;
  blurb: string;
  catalogues: Catalogue[];
};

const SECTIONS: CatalogueSection[] = [
  {
    section: "Bags & Gifts",
    blurb:
      "Corporate gifting, conference bags, backpacks, drinkware and lifestyle gifts — perfect for branded giveaways and staff packs.",
    catalogues: [
      {
        title: "2024 Gifts & Bags Catalogue",
        description:
          "Browse the full range of branded bags and corporate gifts available for print and embroidery.",
        url: "https://paznsaapp02.blob.core.windows.net/catalogues/2024-Gifts-and-bags-Catalogue/index.html",
      },
    ],
  },
];

export function CataloguesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="solid" />

      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-4xl font-bold text-charcoal md:text-5xl">Catalogues</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Browse our supplier catalogues. Click any catalogue to open the full digital flipbook in a
            new tab — then send us the codes of what you like for a quote.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6 space-y-16">
          {SECTIONS.map((sec) => (
            <div key={sec.section}>
              <div className="mb-6 border-l-4 border-primary pl-4">
                <h2 className="text-2xl font-bold text-charcoal md:text-3xl">{sec.section}</h2>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">{sec.blurb}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sec.catalogues.map((cat) => (
                  <a
                    key={cat.url}
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal">{cat.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{cat.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Open Catalogue <ExternalLink className="h-4 w-4" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-charcoal">Found something you like?</h2>
          <p className="mt-2 text-muted-foreground">
            WhatsApp us the product code(s) from the catalogue and we'll send you a quote with branding
            options.
          </p>
          <a
            href="https://wa.me/27698384045?text=Hi%20Blank2Branded%2C%20I%27d%20like%20a%20quote%20on%20items%20from%20your%20catalogue."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            Request a Quote on WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
