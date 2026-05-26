import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import dtfHeroBg from "@/assets/dtf-hero-bg.jpg";
import dtfLargeFormat from "@/assets/dtf-large-format.jpg";
import {
  Ruler,
  Palette,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  ArrowRight,
  Printer,
  Maximize2,
  FileImage,
} from "lucide-react";

export const Route = createFileRoute("/dtf")({
  head: () => ({
    meta: [
      { title: "DTF Prints — A6 to 10m Roll Prints | Blank2Branded" },
      {
        name: "description",
        content:
          "Full-colour DTF transfers from A6 up to 10 metres long. 20 cm wide roll prints. We print anything you like — logos, illustrations, photographic prints. Nationwide shipping from Mbombela.",
      },
      { property: "og:title", content: "DTF Prints — A6 to 10m | Blank2Branded" },
      {
        property: "og:description",
        content:
          "Full-colour DTF transfers from A6 up to 10 m long. 20 cm wide roll prints. Print anything you like.",
      },
      { property: "og:url", content: "/dtf" },
    ],
    links: [{ rel: "canonical", href: "/dtf" }],
  }),
  component: DtfPage,
});

const SIZES: { name: string; dim: string; tag?: string }[] = [
  { name: "A6", dim: "10.5 × 14.8 cm", tag: "Smallest" },
  { name: "A5", dim: "14.8 × 21 cm" },
  { name: "A4", dim: "21 × 29.7 cm", tag: "Popular" },
  { name: "Roll Print", dim: "20 cm wide × up to 10 m long", tag: "Long Run" },
  { name: "Custom", dim: "Any length up to 10 m on request", tag: "We'll quote" },
];

const FEATURES = [
  { icon: Palette, color: "magenta", title: "Full-Colour CMYK + White", body: "Photographic detail, gradients and bold neons — all printed with a true white underbase so colours pop on any garment colour." },
  { icon: Maximize2, color: "cyan", title: "A6 → 10 Metres", body: "From tiny chest logos to full-length roll prints. 20 cm wide, up to 10 m long per run — perfect for repeat orders and bulk jobs." },
  { icon: Sparkles, color: "lime", title: "Print Anything You Like", body: "Logos, illustrations, photos, lettering, repeat patterns. Send us the artwork — if it fits in the size, we can print it." },
  { icon: Layers, color: "primary", title: "Soft Hand-Feel", body: "Thin, stretchy and durable film that bonds to cotton, polyester, blends, fleece and more without going crusty." },
  { icon: Clock, color: "purple", title: "48hr Turnaround", body: "Standard production in 48 hours. Need it sooner? Ask about our rush slots." },
  { icon: ShieldCheck, color: "yellow", title: "Wash-Tested", body: "50+ wash cycles with no cracking when applied at the correct heat, pressure and time." },
];

const STEPS = [
  { n: "01", icon: FileImage, color: "magenta", title: "Send Artwork", body: "PNG with transparent background at 300dpi works best. We'll review and flag any issues for free." },
  { n: "02", icon: Ruler, color: "cyan", title: "Pick Your Size", body: "From A6 chest prints to 10-metre roll runs. Gang multiple designs on a single roll to save on cost." },
  { n: "03", icon: Printer, color: "lime", title: "We Print + Ship", body: "Production in 48 hours, then couriered nationwide. Or press them onto blanks for you — full service available." },
];

function DtfPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={dtfHeroBg}
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
          <p className="text-sm font-semibold uppercase tracking-wider text-magenta">
            DTF Transfers
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">A6 to 10 metres.</span> We print anything you like.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Full-colour, photo-quality DTF prints — from tiny chest logos up to 10-metre roll runs. 20 cm wide rolls. Soft hand-feel, wash-tested, ready to press.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#sizes"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal"
            >
              View Sizes
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan">Why DTF</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
              One process. <span className="text-gradient-dtf">Endless designs.</span>
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{ boxShadow: `0 0 0 0 transparent` }}
                >
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110 group-hover:-rotate-6"
                    style={{ backgroundColor: `var(--${f.color})`, boxShadow: `0 10px 28px -10px color-mix(in oklab, var(--${f.color}) 60%, transparent)` }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-charcoal">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SIZES */}
      <section
        id="sizes"
        className="relative overflow-hidden border-y border-border bg-charcoal py-24 text-background"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-dtf" />
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-magenta blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan">
                Print Sizes
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                From a coin to a <span className="text-gradient-dtf">10-metre roll.</span>
              </h2>
              <p className="mt-6 text-lg text-background/70">
                Our printer runs 20 cm wide rolls up to 10 metres long. Whether you need 50 small chest logos ganged on one roll or a long continuous run — same machine, same colours, one quote.
              </p>

              <div className="mt-8 overflow-hidden rounded-2xl border border-background/10">
                <img
                  src={dtfLargeFormat}
                  alt="Large format DTF print on transparent film"
                  loading="lazy"
                  width={1400}
                  height={900}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SIZES.map((s, i) => {
                const palette = ["magenta", "cyan", "lime", "primary", "purple", "yellow"];
                const color = palette[i % palette.length];
                return (
                  <div
                    key={s.name}
                    className="group relative overflow-hidden rounded-xl border border-background/10 bg-background/[0.04] p-6 backdrop-blur transition-all hover:border-background/30 hover:bg-background/[0.08]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: `var(--${color})` }}
                        >
                          {s.tag ?? "Standard"}
                        </p>
                        <h3 className="mt-2 text-2xl font-black">{s.name}</h3>
                      </div>
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: `var(--${color})` }}
                      >
                        <Ruler className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-background/70">{s.dim}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-magenta">How it works</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
              Three steps. <span className="text-gradient-dtf">Done.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className="relative rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-5xl font-black"
                      style={{ color: `var(--${s.color})` }}
                    >
                      {s.n}
                    </span>
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: `var(--${s.color})` }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-charcoal">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-y border-border bg-charcoal py-20 text-background">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-dtf" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-dtf" />
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-lime blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-magenta blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Got artwork? <span className="text-gradient-dtf">Let's print it.</span>
          </h2>
          <p className="mt-4 text-lg text-background/70">
            Upload your design and we'll come back with a quote within 4 business hours.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.03]"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
