import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Award, Zap, Handshake, ArrowRight } from "lucide-react";
import aboutHeroBg from "@/assets/about-hero-bg.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Backend for SA's Clothing Brands | Blank2Branded" },
      {
        name: "description",
        content:
          "Blank2Branded is a Mbombela-based supplier of DTF transfers and blank apparel, serving brands, businesses and individuals across South Africa. Minimum 5 pieces per order.",
      },
      { property: "og:title", content: "About Blank2Branded" },
      { property: "og:description", content: "Supplier of DTF + blanks, built by printers and brand builders. Min 5 pieces per order." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden border-b border-border py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={aboutHeroBg}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover blur-[2px]"
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            About Us
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            The Backend for SA's Clothing Brands.
          </h1>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-charcoal/80">
            <p>
              Blank2Branded started to solve the gap between expensive retail
              blanks and unreliable print suppliers. We're printers and brand
              builders ourselves, so we know what matters: quality, speed, and
              pricing that lets you actually profit. We supply brands, businesses
              and individuals from just 5 pieces per order.
            </p>
            <p>
              Based in Mbombela, serving all of South Africa — we ship
              nationwide via courier so wherever your brand is, your stock
              arrives on time.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border bg-charcoal py-24 text-background md:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rotate-12 bg-primary blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Our Principles
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                What we{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">stand for.</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/40" />
                </span>
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-background/70 md:justify-self-end md:text-right">
              Three values that shape how we quote, print, pack and ship —
              every single order, no exceptions.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-background/10 bg-background/10 md:grid-cols-3">
            {[
              {
                icon: Award,
                num: "01",
                title: "Quality Obsessed",
                desc: "Every DTF transfer and blank is tested to wash, stretch, and last. If we wouldn't put our brand on it, we won't sell it.",
              },
              {
                icon: Zap,
                num: "02",
                title: "Speed First",
                desc: "48hr DTF turnaround. Quotes in hours, not days. Your business doesn't wait — neither do we.",
              },
              {
                icon: Handshake,
                num: "03",
                title: "Partners, Not Gatekeepers",
                desc: "Real pricing, real support. Brands, businesses or individuals — order from 5 pieces. No attitude, no gatekeeping.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="group relative overflow-hidden bg-charcoal p-10 transition-colors duration-300 hover:bg-charcoal/60"
              >
                <span className="absolute right-6 top-6 text-5xl font-black text-background/5 transition-colors duration-300 group-hover:text-primary/30">
                  {p.num}
                </span>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <p.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-8 text-2xl font-bold tracking-tight text-background">
                    {p.title}
                  </h3>
                  <div className="mt-4 h-px w-10 bg-primary transition-all duration-300 group-hover:w-20" />
                  <p className="mt-5 text-sm leading-relaxed text-background/65">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight text-charcoal md:text-5xl">
            Let's build your brand together.
          </h2>
          <Link
            to="/contact"
            className="mt-10 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Get a Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
