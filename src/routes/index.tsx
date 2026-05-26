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


        {/* DTF colour blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-blob absolute -right-40 -top-20 h-[28rem] w-[28rem] rounded-full bg-magenta opacity-25 blur-3xl" />
          <div className="animate-float-blob absolute -left-32 top-40 h-96 w-96 rounded-full bg-cyan opacity-25 blur-3xl [animation-delay:-6s]" />
          <div className="animate-float-blob absolute right-20 bottom-0 h-80 w-80 rounded-full bg-lime opacity-25 blur-3xl [animation-delay:-12s]" />
          <div className="animate-float-blob absolute left-1/3 bottom-10 h-72 w-72 rounded-full bg-primary opacity-30 blur-3xl [animation-delay:-3s]" />
        </div>


        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-40 pb-16 md:grid-cols-2 md:pt-48 md:pb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-gradient-dtf" />
              DTF + Apparel Supplier — South Africa
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-7xl">
              DTF Prints + Blank Tees,{" "}
              <span className="relative inline-block">
                <span className="text-gradient-dtf relative z-10">Shipped SA-Wide</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-dtf opacity-30" />
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Blank2Branded supplies clothing brands & businesses with premium
              DTF transfers and blank apparel. Print, press, or supply — we're
              your backend.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
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
      <section className="relative overflow-hidden border-b border-border bg-charcoal text-background">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-dtf" />
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 text-center text-sm font-medium md:grid-cols-3 md:py-5">
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
            Trusted by 100+ SA Brands
          </div>
          <div className="flex items-center justify-center gap-2 md:border-x md:border-background/10">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            48hr DTF Turnaround
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            Nationwide Courier
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="relative border-b border-border py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-cyan/30 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-magenta/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-magenta">
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
                color: "cyan",
                shadow: "shadow-cyan/40",
              },
              {
                icon: Shirt,
                title: "Blank Apparel",
                desc: "Premium tees, hoodies, sweats at honest pricing. Quality blanks ready for your brand. Min 5 pieces.",
                num: "02",
                color: "magenta",
                shadow: "shadow-magenta/40",
              },
              {
                icon: Package,
                title: "Print + Press",
                desc: "Full service: we supply blanks, press your design, and ship finished goods to your door.",
                num: "03",
                color: "primary",
                shadow: "shadow-primary/40",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{ boxShadow: undefined }}
              >
                <span
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ backgroundColor: `var(--${s.color})` }}
                />
                <div
                  className="absolute right-6 top-6 text-5xl font-black opacity-10 transition-opacity group-hover:opacity-30"
                  style={{ color: `var(--${s.color})` }}
                >
                  {s.num}
                </div>
                <div className="relative">
                  <div
                    className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `var(--${s.color})` }}
                  >
                    <s.icon className="h-7 w-7" strokeWidth={1.75} />
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
      <section className="relative overflow-hidden border-b border-border bg-charcoal py-28 text-background">
        {/* ink-splash colour field */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="animate-float-blob absolute -left-32 top-10 h-96 w-96 rounded-full bg-magenta opacity-30 blur-3xl" />
          <div className="animate-float-blob absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan opacity-25 blur-3xl [animation-delay:-6s]" />
          <div className="animate-float-blob absolute left-1/2 bottom-0 h-80 w-80 -translate-x-1/2 rounded-full bg-lime opacity-25 blur-3xl [animation-delay:-3s]" />
          <div className="animate-float-blob absolute right-1/4 -bottom-10 h-72 w-72 rounded-full bg-primary opacity-30 blur-3xl [animation-delay:-9s]" />
        </div>
        {/* dotted grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-dtf" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-dtf" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-background/60">
              <span className="h-px w-8 bg-gradient-dtf" />
              Process
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              From DM to{" "}
              <span className="text-gradient-dtf">doorstep</span> in 4 steps.
            </h2>
            <p className="mt-5 max-w-xl text-base text-background/70 md:text-lg">
              No middlemen, no guesswork. Here's exactly how your order moves
              through the workshop.
            </p>
          </div>

          {/* connector line */}
          <div className="relative mt-20">
            <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-cyan via-magenta to-lime opacity-50 md:block" />

            <div className="grid gap-12 md:grid-cols-4 md:gap-6">
              {[
                { icon: FileText, title: "Quote", desc: "Drop us your order details on WhatsApp. Pricing back in hours, not days.", color: "cyan" },
                { icon: Palette, title: "Artwork", desc: "Send your files. We prep, proof and lock in colours for production.", color: "magenta" },
                { icon: Factory, title: "Production", desc: "Print, press or pack — fast turnaround from our Mbombela workshop.", color: "primary" },
                { icon: Truck, title: "Courier", desc: "Tracked nationwide delivery, straight to your door.", color: "lime" },
              ].map((step, i) => (
                <div key={step.title} className="group relative">
                  {/* numbered badge */}
                  <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center md:mx-0">
                    <span
                      className="absolute inset-0 rounded-full opacity-60 blur-xl transition-opacity group-hover:opacity-100"
                      style={{ backgroundColor: `var(--${step.color})` }}
                    />
                    <span
                      className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 text-3xl font-black text-background"
                      style={{
                        borderColor: `var(--${step.color})`,
                        backgroundColor: "var(--charcoal)",
                      }}
                    >
                      0{i + 1}
                    </span>
                  </div>

                  <div className="mt-8 text-center md:text-left">
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:-rotate-6"
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--${step.color}) 18%, transparent)`,
                        color: `var(--${step.color})`,
                      }}
                    >
                      <step.icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-background">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-background/65">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* IN THE WORKSHOP */}
      <section className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan">
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
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-magenta">
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
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime">
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

      <section className="relative overflow-hidden border-b border-border py-24">
        <div className="pointer-events-none absolute -left-32 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple/15 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-purple">
              The Difference
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-charcoal md:text-5xl">
              Why <span className="text-gradient-dtf">Blank2Branded</span>?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              We built this for the brands, businesses and individuals we wish
              had a supplier like this when we started. Honest pricing, no gatekeeping.
            </p>
          </div>

          <ul className="space-y-5">
            {[
              { text: "Honest pricing — no retail markups.", color: "primary" },
              { text: "Open to brands, businesses and individuals (min 5 pieces).", color: "magenta" },
              { text: "No middlemen. Direct supplier relationship.", color: "cyan" },
              { text: "Tech support for new brands getting set up.", color: "purple" },
              { text: "SA-based. Real humans on WhatsApp.", color: "lime" },
              { text: "Fast turnaround and quality you can resell.", color: "yellow" },
            ].map((point) => (
              <li
                key={point.text}
                className="flex items-start gap-4 border-b border-border pb-5 last:border-0"
              >
                <span
                  className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--${point.color}) 18%, transparent)`,
                  }}
                >
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: `var(--${point.color})` }}
                  />
                </span>
                <span className="text-base font-medium text-charcoal">
                  {point.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-charcoal py-28 text-background">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-magenta blur-3xl" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-lime blur-3xl" />
          <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-dtf" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-dtf" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-6xl">
            Ready to go from{" "}
            <span className="text-gradient-dtf">Blank to Branded?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-background/70">
            Order from 5 pieces and up — DTF prints and blank apparel, shipped nationwide.
          </p>
          <Link
            to="/shop"
            className="mt-10 inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.03] hover:shadow-2xl"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
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
