import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@/lib/static-router";
import { ArrowRight, MessageCircle, CheckCircle2, Truck, Palette, Clock, Ruler, Shirt } from "lucide-react";
import sportsKitsHeroBg from "@/assets/sports-kits-hero-bg.jpg";

import rugbyJersey from "@/assets/sports-kits/rugby-jersey.jpg";
import soccerKit from "@/assets/sports-kits/soccer-kit.jpg";
import netballDress from "@/assets/sports-kits/netball-dress.jpg";
import hockeyKit from "@/assets/sports-kits/hockey-kit.jpg";
import cricketShirt from "@/assets/sports-kits/cricket-shirt.jpg";
import basketballKit from "@/assets/sports-kits/basketball-kit.jpg";
import cyclingJersey from "@/assets/sports-kits/cycling-jersey.jpg";
import athleticsVest from "@/assets/sports-kits/athletics-vest.jpg";
import juniorRugby from "@/assets/sports-kits/junior-rugby.jpg";

const WA_NUMBER = "27698384045";
const waQuote = (topic: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi Blank2Branded, I'd like a quote for a sublimated ${topic} kit. Please send pricing and turnaround.`)}`;

const SPORTS: { sport: string; image: string; blurb: string }[] = [
  { sport: "Rugby", image: rugbyJersey, blurb: "Full-colour jerseys, shorts and socks — school, club and touring teams." },
  { sport: "Soccer", image: soccerKit, blurb: "Match kits and training bibs with team names, numbers and sponsors baked in." },
  { sport: "Netball", image: netballDress, blurb: "Ladies and junior netball dresses, vest-and-skirt sets in team colours." },
  { sport: "Hockey", image: hockeyKit, blurb: "Field hockey shirts and shorts — men's, ladies' and junior sizing." },
  { sport: "Cricket", image: cricketShirt, blurb: "Playing shirts, vests and training tops in sublimated club colours." },
  { sport: "Basketball", image: basketballKit, blurb: "Reversible vests and shorts in full-colour custom design." },
  { sport: "Cycling", image: cyclingJersey, blurb: "Aero cycling jerseys and bibs for clubs, charity rides and sponsors." },
  { sport: "Athletics", image: athleticsVest, blurb: "Running vests, singlets and school athletics kits — light and breathable." },
];

const KIT_TIERS = [
  { size: "10 – 24 kits", note: "Ideal for junior teams and squads" },
  { size: "25 – 49 kits", note: "Best value for full club sides" },
  { size: "50+ kits", note: "Wholesale pricing — schools & academies" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is a sublimated sports kit?",
    a: "A sublimated sports kit is apparel where the design, team colours, sponsor logos, names and numbers are dyed directly into the polyester fabric using heat and pressure. Unlike vinyl or screen print, the design becomes part of the fabric — it never cracks, peels or fades.",
  },
  {
    q: "How long does it take to make a custom sports kit?",
    a: "Standard turnaround for sublimated sports kits is 10 – 15 working days from artwork approval, plus courier delivery. Rush production is possible on request — get in touch for lead times on tight deadlines.",
  },
  {
    q: "What is the minimum order for sublimated kits?",
    a: "Our minimum order is 10 units per kit type. There's no maximum — we regularly produce full club sides, school teams and multi-sport orders for 100+ athletes.",
  },
  {
    q: "Do you deliver sports kits nationwide in South Africa?",
    a: "Yes. We're based in Mbombela (Mpumalanga) and courier finished kits nationwide — Johannesburg, Pretoria, Cape Town, Durban, Port Elizabeth, Bloemfontein and everywhere in between.",
  },
  {
    q: "Can I supply my own artwork or logo?",
    a: "Yes — print-ready artwork must be supplied by the client (vector or 300dpi files preferred). If you need design or layout work, we offer it as a paid service — contact us for a design fee quote before production starts.",
  },
  {
    q: "What sports do you make kits for?",
    a: "Rugby, soccer, netball, hockey, cricket, basketball, cycling, athletics and general team apparel. If you need something we haven't listed, ask — if it can be sewn from polyester, we can sublimate it.",
  },
  {
    q: "How much does a sublimated sports kit cost in South Africa?",
    a: "Pricing depends on the item (jersey vs full set), fabric weight, quantity and whether shorts/socks are included. Request a quote via WhatsApp with your quantity and we'll price it same-day.",
  },
  {
    q: "Are the kits durable and colour-fast?",
    a: "Yes. Because the ink is bonded into the polyester fibres, sublimated kits retain their colour through hundreds of wash cycles. There's no printed layer to crack, so the design lasts as long as the fabric.",
  },
];

export function SportsKitsPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Sublimated Sports Kits South Africa",
    description:
      "Custom sublimated sports kits for rugby, soccer, netball, hockey, cricket, basketball, cycling and athletics teams across South Africa.",
    brand: { "@type": "Brand", name: "Blank2Branded" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ZAR",
      lowPrice: "180",
      offerCount: 8,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={sportsKitsHeroBg}
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
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Sublimated Sports Kits</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            Sublimated Sports Kits <span className="text-gradient-dtf">South Africa</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Full-colour custom kits for rugby, soccer, netball, hockey, cricket, basketball, cycling and athletics — team
            names, numbers and sponsor logos dyed into the fabric. Delivered nationwide from Mbombela in 10–15 working
            days.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={waQuote("sports")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              <MessageCircle className="h-4 w-4" />
              Request a Kit Quote
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-charcoal transition-all hover:border-primary hover:text-primary"
            >
              Send Artwork <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-border py-14 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Palette, title: "Full-colour design", copy: "Unlimited colours, gradients, photos and sponsor logos — no setup fees per colour." },
            { icon: Shirt, title: "Never cracks or peels", copy: "The design is dyed into polyester fibres, not printed on top. Colour-fast through hundreds of washes." },
            { icon: Clock, title: "10 – 15 day turnaround", copy: "From artwork approval to courier collection. Rush production available on request." },
            { icon: Truck, title: "Nationwide courier", copy: "Delivered to Johannesburg, Cape Town, Pretoria, Durban and everywhere in between." },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-6">
              <b.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-black text-charcoal">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPORTS GRID */}
      <section id="sports" className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-magenta">Kits by Sport</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
              Custom kits for every code
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Mens, ladies and juniors. Full sets — jerseys, shorts, socks and tracksuits — or individual pieces. Order
              per player or in bulk for the whole club.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SPORTS.map((s) => (
              <a
                key={s.sport}
                href={waQuote(s.sport.toLowerCase())}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={s.image}
                    alt={`Sublimated ${s.sport.toLowerCase()} kit — Blank2Branded South Africa`}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-charcoal">{s.sport} Kits</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Get {s.sport.toLowerCase()} quote <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            ))}
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
            <a
              href={waQuote("junior")}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={juniorRugby} alt="Junior sublimated kit" loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-black text-charcoal">Junior & School Kits</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">School teams, u10–u19 sizing across every sport we produce.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Get school quote <ArrowRight className="h-4 w-4" /></span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-magenta">How Sublimation Works</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
              From artwork to finished kit
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-4">
            {[
              { step: "1", title: "Send your brief", copy: "Team colours, sponsor logos, player names and numbers, quantity and sizes." },
              { step: "2", title: "Supply artwork", copy: "Send us your print-ready artwork. Need design help? We offer it as a paid service — contact us for a design fee quote." },
              { step: "3", title: "Sublimation print", copy: "Design is dyed into polyester panels using heat and pressure — bonded permanently to the fabric." },
              { step: "4", title: "Cut, sew & courier", copy: "Panels are cut and sewn into finished garments and couriered nationwide within 10–15 days." },
            ].map((s) => (
              <li key={s.step} className="rounded-2xl border border-border bg-card p-6">
                <div className="text-3xl font-black text-primary">{s.step}</div>
                <h3 className="mt-3 text-lg font-black text-charcoal">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-magenta">Pricing & MOQ</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-charcoal md:text-5xl">Volume tiers</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Minimum 10 kits per style. The more you order, the lower the per-kit price. Request a quote for exact
              pricing on your quantity and item mix.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {KIT_TIERS.map((t) => (
              <div key={t.size} className="rounded-2xl border border-border bg-card p-6">
                <Ruler className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-xl font-black text-charcoal">{t.size}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.note}</p>
                <a
                  href={waQuote("sports")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  Get pricing <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-magenta">FAQ</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
              Sublimated sports kits — your questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4">
                  <h3 className="text-base font-black text-charcoal md:text-lg">{f.q}</h3>
                  <span className="mt-1 text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground md:text-base">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight text-charcoal md:text-5xl">
            Ready to kit out your team?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Send us your team colours, quantity and print-ready artwork — we'll come back with pricing and a delivery date within
            4 business hours. Design services available on request for an additional fee.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={waQuote("sports")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Quote
            </a>
            <Link
              to="/sublimation"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-charcoal transition-all hover:border-primary hover:text-primary"
            >
              Browse Sublimation Range <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PHOTO CREDITS */}
      <section className="border-t border-border bg-muted/20 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs text-muted-foreground">
            <strong className="font-semibold text-charcoal">Photo credits:</strong>{" "}
            Sports photography shown for illustrative purposes under Creative Commons licences. Sources include{" "}
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Wikimedia Commons</a>,{" "}
            <a href="https://www.flickr.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Flickr</a> and{" "}
            <a href="https://www.rawpixel.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Rawpixel</a> (CC0 / CC BY / CC BY-SA).
            Hockey photo: Test field hockey South Africa v Germany 2023 (public domain).
          </p>
        </div>
      </section>


      <Footer />
    </main>
  );
}
