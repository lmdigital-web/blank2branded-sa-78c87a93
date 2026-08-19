import { Link } from "@/lib/static-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import blanksHeroBg from "@/assets/blanks-hero-bg.jpg";
import cardedCotton from "@/assets/blanks-carded-cotton.jpg";
import combedCotton from "@/assets/blanks-combed-cotton.jpg";
import polyester from "@/assets/blanks-polyester.jpg";
import golfShirts from "@/assets/blanks-golf.jpg";
import hoodies from "@/assets/blanks-hoodies.jpg";
import { Shirt, Sparkles, Wind, Flag, Flame, ArrowRight, Check } from "lucide-react";

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "magenta" | "cyan" | "primary" | "lime" | "purple";
  image: string;
  body: string;
  bullets: string[];
};

const SECTIONS: Section[] = [
  {
    id: "carded-cotton",
    eyebrow: "Everyday Workhorse",
    title: "Carded Cotton T-Shirts",
    icon: Shirt,
    color: "magenta",
    image: cardedCotton,
    body: "Our carded cotton tees are the go-to for promo runs, events, school tees and uniforms. Soft enough to wear all day, tough enough to take DTF, screen print or embroidery without complaint.",
    bullets: [
      "100% cotton, ring-spun for a smooth print surface",
      "Classic relaxed fit — unisex sizing S to 3XL",
      "Wide colour range with stock-standard whites, blacks and navy",
    ],
  },
  {
    id: "combed-cotton",
    eyebrow: "Premium Feel",
    title: "Combed Cotton T-Shirts",
    icon: Sparkles,
    color: "primary",
    image: combedCotton,
    body: "A step up in feel and finish. Combed cotton removes the short fibres, leaving a softer hand, cleaner surface and longer-lasting print. The pick for brand drops, retail-quality merch and gifting.",
    bullets: [
      "Combed ring-spun cotton — silky soft against the skin",
      "Premium weight, holds its shape wash after wash",
      "Best base for high-detail DTF and fine screen prints",
    ],
  },
  {
    id: "polyester",
    eyebrow: "Performance",
    title: "100% Polyester T-Shirts",
    icon: Wind,
    color: "cyan",
    image: polyester,
    body: "Lightweight, moisture-wicking and quick-drying. Built for sports teams, gyms, running clubs, hospitality crews and any environment where cotton just can't keep up.",
    bullets: [
      "Dry-fit polyester — breathable and quick-drying",
      "Bold, vivid colours that stay sharp under DTF",
      "Available in unisex, ladies and kids cuts",
    ],
  },
  {
    id: "golf-shirts",
    eyebrow: "Corporate & Clubs",
    title: "Golf Shirts",
    icon: Flag,
    color: "lime",
    image: golfShirts,
    body: "Collared golf shirts in two fabric options — pick the one that suits your brand. Perfect for corporate uniforms, golf days, trade shows and staff kits.",
    bullets: [
      "Cotton pique — premium, breathable, classic finish",
      "Polyester dry-fit — light, sporty, easy-care",
      "Embroidery on the chest or DTF for full-colour logos",
    ],
  },
  {
    id: "hoodies",
    eyebrow: "Cold-Weather Staple",
    title: "Hoodies",
    icon: Flame,
    color: "purple",
    image: hoodies,
    body: "Heavyweight fleece-backed hoodies built to last. Whether you're branding a team, a gym, a school or a streetwear drop — these take print and embroidery beautifully.",
    bullets: [
      "260g fleece-backed for warmth and structure",
      "Pullover and full-zip options in core colours",
      "Sizes XS to 3XL — unisex fit",
    ],
  },
];

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const Icon = section.icon;
  const reverse = index % 2 === 1;
  return (
    <div id={section.id} className="scroll-mt-32">
      <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:[&>div:first-child]:order-2" : ""}`}>
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-2xl opacity-30 blur-2xl"
            style={{ backgroundColor: `var(--${section.color})` }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
            <img
              src={section.image}
              alt={section.title}
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
              style={{
                backgroundColor: `var(--${section.color})`,
                boxShadow: `0 8px 24px -8px color-mix(in oklab, var(--${section.color}) 60%, transparent)`,
              }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: `var(--${section.color})` }}
            >
              {section.eyebrow}
            </p>
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-charcoal md:text-4xl">
            {section.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            {section.body}
          </p>
          <ul className="mt-6 space-y-3">
            {section.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-charcoal">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: `var(--${section.color})` }}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-charcoal transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function BlanksPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={blanksHeroBg}
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
            Our Blanks
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">Blank</span> Apparel SA.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Premium t-shirts, golf shirts and hoodies — ready for DTF, screen print or embroidery. Nationwide shipping from Mbombela.
          </p>


          {/* Quick nav */}
          <div className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-semibold text-charcoal backdrop-blur transition-colors hover:border-charcoal"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl space-y-24 px-6 md:space-y-32">
          {SECTIONS.map((section, i) => (
            <SectionBlock key={section.id} section={section} index={i} />
          ))}
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
            Ready to <span className="text-gradient-dtf">brand</span> your blanks?
          </h2>
          <p className="mt-4 text-lg text-background/85">
            Tell us what you need and we'll quote you fast.
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
    </main>
  );
}
