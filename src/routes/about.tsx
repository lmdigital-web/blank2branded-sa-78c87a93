import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Award, Zap, Handshake, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Backend for SA's Clothing Brands | Blank2Branded" },
      {
        name: "description",
        content:
          "Blank2Branded is a Mbombela-based trade supplier of DTF transfers and blank apparel, serving clothing brands across South Africa.",
      },
      { property: "og:title", content: "About Blank2Branded" },
      { property: "og:description", content: "Trade supplier of DTF + blanks, built by printers and brand builders." },
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

      <section className="border-b border-border py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            About Us
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            The Backend for SA's Clothing Brands.
          </h1>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              Blank2Branded started to solve the gap between expensive retail
              blanks and unreliable print suppliers. We're printers and brand
              builders ourselves, so we know what matters: quality, speed, and
              pricing that lets you actually profit.
            </p>
            <p>
              Based in Mbombela, serving all of South Africa — we ship
              nationwide via courier so wherever your brand is, your stock
              arrives on time.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
            What we stand for.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Award,
                title: "Quality Obsessed",
                desc: "Every DTF transfer and blank is tested to wash, stretch, and last. If we wouldn't put our brand on it, we won't sell it.",
              },
              {
                icon: Zap,
                title: "Speed First",
                desc: "48hr DTF turnaround. Quotes in hours, not days. Your business doesn't wait — neither do we.",
              },
              {
                icon: Handshake,
                title: "Trade Partners, Not Gatekeepers",
                desc: "Real pricing, real support. We help new brands set up. No minimum-spend gates or attitude.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-lg border border-border bg-card p-8"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-charcoal text-primary">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-charcoal">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
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
            Get Your Trade Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
