import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Printer,
  Shirt,
  Package,
  ArrowRight,
  CheckCircle2,
  FileText,
  Palette,
  Factory,
  Truck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DTF Prints + Blank T-Shirts South Africa | Blank2Branded" },
      {
        name: "description",
        content:
          "Trade supplier of DTF transfers & blank apparel. Nationwide shipping. Print, press, or supply for SA clothing brands.",
      },
      { property: "og:title", content: "DTF Prints + Blank T-Shirts South Africa | Blank2Branded" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Geometric accents */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute left-10 bottom-0 h-64 w-64 rotate-45 bg-charcoal" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Trade Supplier — South Africa
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-7xl">
              DTF Prints + Blank Tees,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Shipped SA-Wide</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/30" />
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Blank2Branded supplies clothing brands & businesses with premium
              DTF transfers and blank apparel. Print, press, or supply — we're
              your backend.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Get a Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-md border-2 border-charcoal px-7 py-4 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background"
              >
                View Services
              </a>
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Trade accounts only · MOQ 10 units
            </p>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-border bg-charcoal text-background">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 text-center text-sm font-medium md:grid-cols-3 md:py-5">
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Trusted by 100+ SA Brands
          </div>
          <div className="flex items-center justify-center gap-2 md:border-x md:border-background/10">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            48hr DTF Turnaround
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Nationwide Courier
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              What We Do
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-charcoal md:text-5xl">
              Three ways we power your brand.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Printer,
                title: "DTF Transfers",
                desc: "Upload your art, we print & ship ready-to-press transfers. Vivid colour, stretch-safe, durable wash.",
                num: "01",
              },
              {
                icon: Shirt,
                title: "Blank Apparel",
                desc: "Premium tees, hoodies, sweats at trade pricing. Quality blanks ready for your brand.",
                num: "02",
              },
              {
                icon: Package,
                title: "Print + Press",
                desc: "Full service: we supply blanks, press your design, and ship finished goods to your door.",
                num: "03",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-8 transition-all hover:border-charcoal hover:shadow-xl"
              >
                <div className="absolute right-6 top-6 text-5xl font-black text-surface transition-colors group-hover:text-primary/10">
                  {s.num}
                </div>
                <div className="relative">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-charcoal text-primary">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-charcoal">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Process
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-charcoal md:text-5xl">
              How it works.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {[
              { icon: FileText, title: "Quote", desc: "Tell us your order. Get pricing in hours." },
              { icon: Palette, title: "Artwork", desc: "Send files. We prep for production." },
              { icon: Factory, title: "Production", desc: "Print, press, or pack — fast turnaround." },
              { icon: Truck, title: "Courier", desc: "Tracked nationwide delivery to your door." },
            ].map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest text-primary">
                    0{i + 1}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <step.icon className="mt-6 h-7 w-7 text-charcoal" strokeWidth={1.5} />
                <h3 className="mt-4 text-lg font-bold text-charcoal">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="border-b border-border py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              The Difference
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-charcoal md:text-5xl">
              Why Blank2Branded?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              We built this for the brands and shops we wish existed when we
              started. Trade-first, no retail nonsense.
            </p>
          </div>

          <ul className="space-y-5">
            {[
              "Trade-only pricing — no retail markups.",
              "No middlemen. Direct supplier relationship.",
              "Tech support for new brands getting set up.",
              "SA-based. Real humans on WhatsApp.",
              "Fast turnaround and quality you can resell.",
            ].map((point) => (
              <li
                key={point}
                className="flex items-start gap-4 border-b border-border pb-5 last:border-0"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-base font-medium text-charcoal">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal py-24 text-background">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-6xl">
            Ready to go from{" "}
            <span className="text-primary">Blank to Branded?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-background/70">
            Open a trade account and get bulk pricing on DTF prints and blanks.
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Request Trade Access <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
