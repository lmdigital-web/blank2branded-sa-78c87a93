import { createFileRoute, Link } from "@tanstack/react-router";
import dtfPrintingImg from "@/assets/dtf-printing.jpg";
import blankApparelImg from "@/assets/blank-apparel.jpg";
import heroBg from "@/assets/hero-bg.jpg";
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
          "DTF transfers & blank apparel for brands, businesses and individuals. Minimum 5 pieces per order. Nationwide shipping across SA.",
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
      <section className="relative flex min-h-[90vh] items-center overflow-hidden border-b border-border">
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src={heroBg}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover blur-[2px]"
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/55 to-background/10" />
        </div>


        {/* Geometric accents */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute left-10 bottom-0 h-64 w-64 rotate-45 bg-charcoal" />
        </div>


        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              DTF + Apparel Supplier — South Africa
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
              Open to brands, businesses & individuals · Minimum 5 pieces per order
            </p>
          </div>

          {/* Visual: Blank → Branded */}
          <div className="relative hidden md:block" aria-hidden="true">
            <TeeTransform />
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
                desc: "Premium tees, hoodies, sweats at honest pricing. Quality blanks ready for your brand. Min 5 pieces.",
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

      {/* IN THE WORKSHOP */}
      <section className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Inside the Operation
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-charcoal md:text-5xl">
              Real prints. Real stock. Ready to ship.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={dtfPrintingImg}
                  alt="Vivid DTF transfer prints rolling off the printer in the Blank2Branded workshop"
                  width={1280}
                  height={960}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  DTF Production
                </p>
                <h3 className="mt-3 text-2xl font-bold text-charcoal">
                  Vibrant prints, pressed to last.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  High-density DTF transfers with rich colour, soft hand-feel,
                  and durable wash performance — printed in-house and dispatched
                  within 48 hours.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={blankApparelImg}
                  alt="Stacked premium blank t-shirts in the warehouse, ready for printing"
                  width={1280}
                  height={960}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Blank Apparel
                </p>
                <h3 className="mt-3 text-2xl font-bold text-charcoal">
                  Stocked, sorted, ready to ship.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Premium tees, polos, hoodies and more — held in stock at our
                  Mbombela facility and couriered nationwide. Minimum 5 pieces per order.
                </p>
              </div>
            </div>
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
              We built this for the brands, businesses and individuals we wish
              had a supplier like this when we started. Honest pricing, no gatekeeping.
            </p>
          </div>

          <ul className="space-y-5">
            {[
              "Honest pricing — no retail markups.",
              "Open to brands, businesses and individuals (min 5 pieces).",
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

function Tee({ printed = false }: { printed?: boolean }) {
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" fill="none">
      <path
        d="M40 30 L70 15 Q100 35 130 15 L160 30 L185 60 L160 75 L150 65 L150 200 Q100 210 50 200 L50 65 L40 75 L15 60 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="text-charcoal"
        fill={printed ? "var(--surface)" : "transparent"}
      />
      {printed && (
        <g>
          <rect x="70" y="90" width="60" height="60" rx="4" className="fill-primary" />
          <text
            x="100"
            y="126"
            textAnchor="middle"
            className="fill-primary-foreground"
            style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.04em" }}
          >
            B2B
          </text>
        </g>
      )}
    </svg>
  );
}

function TeeTransform() {
  return (
    <div className="relative mx-auto flex max-w-lg items-center justify-between gap-4">
      <div className="relative h-56 w-44 opacity-70">
        <Tee />
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Blank
        </span>
      </div>

      <div className="relative flex h-20 flex-1 items-center justify-center">
        <svg viewBox="0 0 120 24" className="h-6 w-full overflow-visible" fill="none">
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="fill-primary" />
            </marker>
          </defs>
          <line
            x1="0"
            y1="12"
            x2="108"
            y2="12"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
            className="stroke-primary animate-dash-flow"
          />
        </svg>
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          DTF Press
        </span>
      </div>

      <div className="relative h-56 w-44">
        <Tee printed />
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
          Branded
        </span>
      </div>
    </div>
  );
}
