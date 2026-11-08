import {
  ArrowRight,
  BookOpen,
  Check,
  MessageCircle,
  Palette,
  Shirt,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@/lib/static-router";

const WHATSAPP_NUMBER = "27698384045";

const cataloguePages = [
  { page: 7, group: "Men's Tops", title: "Men's Golfer — Fitted Sleeve" },
  { page: 8, group: "Men's Tops", title: "Men's Golfer — Raglan Sleeve" },
  { page: 9, group: "Men's Tops", title: "Men's Ringer Golfer — Fitted Sleeve" },
  { page: 10, group: "Men's Tops", title: "Men's Ringer Golfer — Raglan Sleeve" },
  { page: 11, group: "Men's Tops", title: "Men's Tank Top" },
  { page: 12, group: "Men's Tops", title: "Men's Crew Neck T-Shirt — Fitted Sleeve" },
  { page: 13, group: "Men's Tops", title: "Men's Crew Neck T-Shirt — Raglan Sleeve" },
  { page: 14, group: "Men's Tops", title: "Men's Ringer Crew Neck — Fitted Sleeve" },
  { page: 15, group: "Men's Tops", title: "Men's Ringer Crew Neck — Raglan Sleeve" },
  { page: 16, group: "Men's Tops", title: "Men's V-Neck T-Shirt — Raglan Sleeve" },
  { page: 17, group: "Men's Tops", title: "Men's V-Neck T-Shirt — Fitted Sleeve" },
  { page: 18, group: "Men's Tops", title: "Men's Ringer V-Neck — Raglan Sleeve" },
  { page: 19, group: "Men's Tops", title: "Men's Ringer V-Neck — Fitted Sleeve" },
  { page: 20, group: "Men's Tops", title: "Men's Warm Up — 1/4 Zip" },
  { page: 21, group: "Men's Tops", title: "Men's Mandarin Collar 1/4 Zip Shirt — Fitted Sleeve" },
  { page: 22, group: "Men's Tops", title: "Men's Mandarin Collar 1/4 Zip Shirt — Raglan Sleeve" },
  { page: 23, group: "Men's Tops", title: "Unisex Sports Bib" },
  { page: 24, group: "Men's Tops", title: "Men's Rugby Jersey — Scoop Neck" },
  { page: 25, group: "Men's Tops", title: "Men's Rugby Jersey — Insert Collar" },
  { page: 26, group: "Men's Tops", title: "Men's Caddy Bib" },
  { page: 27, group: "Men's Tops", title: "Men's Cricket Pullover" },
  { page: 28, group: "Men's Tops", title: "Men's Sublimated Lounge Shirt" },
  { page: 29, group: "Men's Tops", title: "Men's Button Shirt — Sublimated Short Sleeve" },
  { page: 31, group: "Hooded T-Shirts", title: "Hooded T-Shirt — Full Dye-Sublimation" },
  { page: 32, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt — Raglan Sleeve" },
  { page: 33, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt — Fitted Sleeve" },
  { page: 34, group: "Hooded T-Shirts", title: "Hooded T-Shirt With Neck Warmer" },
  { page: 35, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt With Neck Warmer — Fitted Sleeve" },
  { page: 36, group: "Hooded T-Shirts", title: "Men's Hooded T-Shirt With Neck Warmer — Raglan Sleeve" },
  { page: 38, group: "Men's Bottoms", title: "Men's Cricket Pants" },
  { page: 39, group: "Men's Bottoms", title: "Men's Shorts" },
  { page: 40, group: "Men's Bottoms", title: "Men's Rugby Shorts — 4 Panel" },
  { page: 41, group: "Men's Bottoms", title: "Men's Rugby Shorts — 9 Panel" },
  { page: 42, group: "Men's Bottoms", title: "Men's Golf Shorts" },
  { page: 43, group: "Men's Bottoms", title: "Men's Athletic Shorts" },
  { page: 44, group: "Men's Bottoms", title: "Men's Briefs" },
  { page: 46, group: "Ladies' Tops", title: "Ladies' Crew Neck T-Shirt — Raglan Sleeve" },
  { page: 47, group: "Ladies' Tops", title: "Ladies' Crew Neck T-Shirt — Fitted Sleeve" },
  { page: 48, group: "Ladies' Tops", title: "Ladies' Ringer Crew Neck — Fitted Sleeve" },
  { page: 49, group: "Ladies' Tops", title: "Ladies' Ringer Crew Neck — Raglan Sleeve" },
  { page: 50, group: "Ladies' Tops", title: "Ladies' V-Neck T-Shirt — Fitted Sleeve" },
  { page: 51, group: "Ladies' Tops", title: "Ladies' V-Neck T-Shirt — Raglan Sleeve" },
  { page: 52, group: "Ladies' Tops", title: "Ladies' Ringer V-Neck — Fitted Sleeve" },
  { page: 53, group: "Ladies' Tops", title: "Ladies' Ringer V-Neck — Raglan Sleeve" },
  { page: 54, group: "Ladies' Tops", title: "Ladies' Golfer — Fitted Sleeve" },
  { page: 55, group: "Ladies' Tops", title: "Ladies' Golfer — Raglan Sleeve" },
  { page: 56, group: "Ladies' Tops", title: "Ladies' Ringer Golfer — Fitted Sleeve" },
  { page: 57, group: "Ladies' Tops", title: "Ladies' Ringer Golfer — Raglan Sleeve" },
  { page: 58, group: "Ladies' Tops", title: "Ladies' Sleeveless Golfer" },
  { page: 59, group: "Ladies' Tops", title: "Ladies' Tank Top" },
  { page: 60, group: "Ladies' Tops", title: "Ladies' Racer Back Vest" },
  { page: 61, group: "Ladies' Tops", title: "Ladies' V-Neck Vest" },
  { page: 62, group: "Ladies' Tops", title: "Ladies' Crew Neck Vest" },
  { page: 63, group: "Ladies' Tops", title: "Ladies' Crop Top — Running Top" },
  { page: 64, group: "Ladies' Tops", title: "Ladies' Ringer Sleeveless Golfer Dress" },
  { page: 65, group: "Ladies' Tops", title: "Ladies' Sport Dress" },
  { page: 66, group: "Ladies' Tops", title: "Ladies' Warm Up — 1/4 Zip" },
  { page: 68, group: "Ladies' Bottoms", title: "Ladies' Skirt" },
  { page: 69, group: "Ladies' Bottoms", title: "Ladies' Skort" },
  { page: 70, group: "Ladies' Bottoms", title: "Ladies' Compression Shorts" },
  { page: 71, group: "Ladies' Bottoms", title: "Ladies' Hot Pants" },
  { page: 72, group: "Ladies' Bottoms", title: "Ladies' Tights — Knee Length" },
  { page: 73, group: "Ladies' Bottoms", title: "Ladies' Tights — 3/4 Length" },
  { page: 74, group: "Ladies' Bottoms", title: "Ladies' Tights — Full Length" },
  { page: 75, group: "Accessories", title: "Unisex Arm Sleeve" },
] as const;

const groups = [
  { id: "mens-tops", title: "Men's Tops", description: "Catalogue pages 7–29." },
  { id: "hooded", title: "Hooded T-Shirts", description: "Catalogue pages 31–36." },
  { id: "mens-bottoms", title: "Men's Bottoms", description: "Catalogue pages 38–44." },
  { id: "ladies-tops", title: "Ladies' Tops", description: "Catalogue pages 46–66." },
  { id: "ladies-bottoms", title: "Ladies' Bottoms", description: "Catalogue pages 68–74." },
  { id: "accessories", title: "Accessories", description: "Catalogue page 75." },
];

const materialOptions = [
  "Reverse Birdseye 140G",
  "Birdseye 140G",
  "Sport Tec 140G",
  "Drop Needle Square 130G",
];

const SUBLIMATION_FAQ = [
  {
    question: "What is sublimation printing and how does it work?",
    answer:
      "Sublimation printing uses heat to transfer a full-colour design into a suitable polyester-based fabric. The design becomes part of the fabric rather than a separate print layer on its surface.",
  },
  {
    question: "What garments are available for custom sublimation?",
    answer:
      "The sublimation catalogue includes t-shirts, golf shirts, rugby jerseys, hooded t-shirts, shorts, dresses, skirts and other sportswear styles. Browse the catalogue or contact us to discuss a garment and its options.",
  },
  {
    question: "Can any fabric be sublimated?",
    answer:
      "No. Sublimation is suited to appropriate polyester-based fabrics, and fabric suitability varies by garment. Tell us which style you are considering so we can discuss its material options.",
  },
  {
    question: "Can we include team colours, logos and detailed artwork?",
    answer:
      "Custom artwork can be incorporated into the garment design. Share your logo, colours, artwork and garment requirements when you enquire, and we can discuss the design with you.",
  },
  {
    question: "How do I request a quote?",
    answer:
      "Contact Blank2Branded with the garment style, quantity, sizes and design requirements you have in mind. You can enquire through WhatsApp or our contact page, and we will discuss the available options with you.",
  },
  {
    question: "Where does Blank2Branded deliver?",
    answer:
      "Blank2Branded is based in Mbombela, Mpumalanga, and serves customers throughout South Africa. Contact us with your location and requirements to discuss delivery for your order.",
  },
];

const sublimationFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SUBLIMATION_FAQ.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const sublimationServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Custom Sublimation Printing & Clothing",
  serviceType: "Sublimation printing for custom clothing and sportswear",
  provider: {
    "@type": "Organization",
    name: "Blank2Branded",
    url: "https://blank2branded.co.za/",
  },
  areaServed: [
    { "@type": "City", name: "Mbombela" },
    { "@type": "Country", name: "South Africa" },
  ],
  url: "https://blank2branded.co.za/sublimation/",
};

const quoteLink = (product?: string) => {
  const message = product
    ? `Hi, I would like a quote for Dye Sublimation ${product}.`
    : "Hi, I would like a quote for custom Dye Sublimation apparel.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

function CataloguePageCard({ page }: { page: (typeof cataloguePages)[number] }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <a
        href={`/sublimation-catalogue/pages/page-${page.page}.webp`}
        target="_blank"
        rel="noreferrer"
        className="block bg-muted"
        aria-label={`Open ${page.title}, catalogue page ${page.page}`}
      >
        <div className="relative aspect-[595/842] overflow-hidden">
          <img
            src={`/sublimation-catalogue/pages/page-${page.page}.webp`}
            alt={`${page.title} — Dye Sublimation Catalogue 2025, page ${page.page}`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <span className="absolute right-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            p. {page.page}
          </span>
        </div>
      </a>

      <div className="p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {page.group}
        </p>
        <h3 className="text-lg font-bold leading-tight text-charcoal">{page.title}</h3>
        <div className="mt-4">
          <a
            href={quoteLink(page.title)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Quote
          </a>
        </div>
      </div>
    </article>
  );
}

export function SublimationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sublimationFaqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sublimationServiceSchema) }}
      />
      <section className="relative min-h-[560px] overflow-hidden bg-black">
        <img
          src="/sublimation-catalogue/cover.webp"
          alt="Dye Sublimation Catalogue cover"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[2px]"
        />
        <div className="absolute inset-0 bg-background/40" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" aria-hidden="true" />

        <Header />

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-start px-6 pb-20 pt-40 lg:px-8">
          <div className="max-w-4xl text-charcoal">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white/75 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Sublimation printing from Mbombela, nationwide
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-charcoal sm:text-5xl lg:text-7xl">
              Custom Sublimation Printing &amp; Clothing in South Africa
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-charcoal/80 sm:text-xl">
              Blank2Branded creates custom sublimated clothing and sportswear for schools, sports
              clubs, businesses, teams and organisations. We are based in Mbombela, Mpumalanga, and
              serve customers throughout South Africa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#catalogue"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                Explore garment styles
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href={quoteLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white/75 px-6 py-3.5 font-bold text-charcoal backdrop-blur transition hover:bg-white"
              >
                <MessageCircle className="h-5 w-5" />
                Request a quote
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white/75 px-6 py-3.5 font-bold text-charcoal backdrop-blur transition hover:bg-white"
              >
                Discuss your design
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="border-b border-border bg-background py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Custom apparel, made to your brief
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Professional Sublimation Printing for Custom Clothing
              </h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Sublimation printing transfers a full-colour design into suitable polyester-based
                fabric using heat. Instead of sitting as a separate surface print, the design is
                incorporated into the fabric. It is a useful option for custom clothing where
                detailed graphics, patterns and garment-wide branding are part of the design.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                Fabric choice matters: not every fabric is suitable for sublimation. We can discuss
                the material specifications shown for each catalogue style and help you identify
                appropriate options for your project.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-6 sm:p-8">
              <h3 className="text-xl font-black text-charcoal">A good fit for team designs</h3>
              <p className="mt-3 leading-7 text-muted-foreground">
                Bring your colours, logos, artwork and garment requirements together in one custom
                design. We work with organisations to discuss the style and material options before
                preparing a quote.
              </p>
              <a
                href={quoteLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" />
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Made for teams and organisations
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Custom Sublimated Sportswear
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Explore custom sublimated sportswear for school teams, clubs and organisations.
                Styles in our catalogue include golf shirts, rugby jerseys, t-shirts, shorts and
                ladies' sport dresses. Our sports kits page also covers soccer and netball teamwear.
                Availability and fabric options vary by style, so get in touch to confirm what suits
                your requirements.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Custom sublimated golf shirts",
                  copy: "Men's and ladies' golf shirt styles appear in the catalogue.",
                },
                {
                  title: "Sublimated rugby jerseys",
                  copy: "Browse the men's rugby jersey styles and discuss a custom design.",
                },
                {
                  title: "Custom netball dresses",
                  copy: "Ask us about suitable dress and teamwear options for your squad.",
                },
                {
                  title: "Custom soccer kits",
                  copy: "Explore teamwear options through our sports kits page.",
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-bold text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </article>
              ))}
            </div>
            <Link
              to="/sports-kits"
              className="mt-7 inline-flex items-center gap-2 font-bold text-primary underline"
            >
              Explore custom sports kits <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-b border-border bg-background py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                For businesses and staff teams
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Custom Sublimated Corporate Clothing &amp; Workwear
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Give your team a consistent, professional look with custom sublimated work T-shirts,
                corporate golf shirts and other suitable polyester apparel. Add your company colours,
                logo and artwork to create clothing that reflects your brand.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                Whether you need branded staff clothing, golf shirts for your business or custom
                polyester garments for an event, share your requirements with us. Garment styles and
                fabric suitability vary, so we will discuss the available options before quoting.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={quoteLink("corporate workwear and golf shirts")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enquire about workwear
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 font-bold text-charcoal transition hover:border-primary"
                >
                  Discuss your requirements <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-6 sm:p-8">
              <h3 className="text-xl font-black text-charcoal">Corporate apparel options</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  Custom sublimated work T-shirts
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  Branded corporate golf shirts
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  Staff clothing and team apparel
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  Custom polyester clothing for businesses and events
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Local expertise, nationwide service
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Sublimation Clothing for Schools, Clubs &amp; Businesses
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                From school sports teams and community clubs to business teams and organisations, we
                can discuss coordinated garments with colours and branding incorporated into the
                design. Blank2Branded is based in Mbombela, Mpumalanga, and works with customers
                throughout South Africa.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:opacity-90"
            >
              Contact us about your project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Built around your artwork
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Why Choose Sublimation Printing?
              </h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Full-colour designs",
                  copy: "Bring multiple colours together in a unified garment design.",
                },
                {
                  title: "Detailed graphics",
                  copy: "Use detailed artwork, patterns and design elements across appropriate styles.",
                },
                {
                  title: "Integrated branding",
                  copy: "Discuss incorporating team colours, logos and other branding into the design.",
                },
                {
                  title: "Design part of the fabric",
                  copy: "On suitable polyester-based fabric, the design is transferred into the fabric rather than applied as a separate surface print.",
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <Palette className="h-7 w-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-black text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                From artwork to garment
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                How the Sublimation Process Works
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                We guide you through the design and garment choices so the proposed material is
                appropriate for the sublimation process.
              </p>
            </div>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Share your brief",
                  copy: "Tell us the garment or teamwear style, quantity, sizes, colours and artwork you have in mind.",
                },
                {
                  step: "2",
                  title: "Confirm the design and fabric",
                  copy: "Discuss the garment's material options and design requirements with us before proceeding.",
                },
                {
                  step: "3",
                  title: "Approve and proceed",
                  copy: "Once the design and order details are agreed, the garment is produced using sublimation. We will discuss next steps and delivery arrangements with you.",
                },
              ].map((item) => (
                <li key={item.step} className="rounded-2xl border border-border bg-card p-6">
                  <span className="text-3xl font-black text-primary">{item.step}</span>
                  <h3 className="mt-3 text-lg font-black text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Start your enquiry
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Ordering Custom Sublimated Clothing
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Send us the garment style, quantity, size range and design details you are
                considering. You can share existing artwork or discuss your design requirements with
                our team. We will help you confirm suitable options and prepare a quotation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={quoteLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:opacity-90"
                >
                  <MessageCircle className="h-5 w-5" />
                  Request a quotation
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-bold text-charcoal transition hover:border-primary"
                >
                  Contact Blank2Branded <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <BookOpen className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-bold text-charcoal">Verified garment styles</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Browse styles and specifications shown in the supplied sublimation catalogue.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Palette className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-bold text-charcoal">Designs for your brief</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Share your artwork and requirements so we can discuss a suitable custom garment
                design.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Trophy className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-bold text-charcoal">Sportswear and more</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The catalogue includes tops, hooded styles, bottoms, dresses and accessories.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Catalogue materials
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Material options shown throughout the range
              </h2>
              <p className="mt-4 text-muted-foreground">
                The catalogue lists different material specifications by garment. These examples are
                catalogue options; fabric suitability for sublimation varies by style and should be
                confirmed before ordering.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {materialOptions.map((material) => (
                <div
                  key={material}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-semibold text-charcoal">{material}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-background py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3 lg:px-8">
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Shirt className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-bold text-charcoal">Browse custom clothing</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Explore catalogue-listed t-shirts, golf shirts, rugby jerseys, hooded t-shirts,
                sportswear and more. See the{" "}
                <Link to="/blanks" className="font-semibold text-primary underline">
                  blank apparel range
                </Link>{" "}
                for other apparel options.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Sparkles className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-bold text-charcoal">Quotations &amp; Order Details</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Pricing and order requirements depend on the garment, design and quantity. Contact
                us with your brief so we can prepare a quotation for the styles you are considering.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Trophy className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-bold text-charcoal">Delivery Across South Africa</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Blank2Branded is based in Mbombela, Mpumalanga, and serves customers throughout
                South Africa. Contact us to discuss delivery arrangements for your order.
              </p>
            </article>
          </div>
        </section>

        <section id="catalogue" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Dye Sublimation Catalogue 2025
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-5xl">
                Browse the Sublimation Catalogue
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                These images show pages from the supplied dye sublimation catalogue. Open a page to
                view the listed garment imagery and specifications, then tell us which styles you
                would like to discuss.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {groups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-primary hover:text-primary"
                >
                  {group.title}
                </a>
              ))}
            </div>

            <div className="mt-16 space-y-20">
              {groups.map((group) => {
                const pages = cataloguePages.filter((item) => {
                  if (group.id === "mens-tops") return item.page >= 7 && item.page <= 29;
                  if (group.id === "hooded") return item.page >= 31 && item.page <= 36;
                  if (group.id === "mens-bottoms") return item.page >= 38 && item.page <= 44;
                  if (group.id === "ladies-tops") return item.page >= 46 && item.page <= 66;
                  if (group.id === "ladies-bottoms") return item.page >= 68 && item.page <= 74;
                  return item.page === 75;
                });

                return (
                  <section key={group.id} id={group.id} className="scroll-mt-20">
                    <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                          {group.description}
                        </p>
                        <h3 className="mt-1 text-3xl font-black text-charcoal">{group.title}</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Shirt className="h-4 w-4" />
                        {pages.length} catalogue {pages.length === 1 ? "page" : "pages"}
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {pages.map((page) => (
                        <CataloguePageCard key={page.page} page={page} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-charcoal py-16 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                Ready to order?
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Tell us about your custom clothing requirements.
              </h2>
              <p className="mt-4 leading-7 text-white/70">
                Share a catalogue page or garment name, quantity, sizes and artwork. We will discuss
                the design requirements and prepare a quotation.
              </p>
            </div>
            <a
              href={quoteLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 font-bold text-primary-foreground transition hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5" />
              Request a quote
            </a>
            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/30 px-7 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 space-y-4">
              {SUBLIMATION_FAQ.map(({ question, answer }) => (
                <details
                  key={question}
                  className="group rounded-2xl border border-border bg-card p-6 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-start justify-between gap-4">
                    <h3 className="text-base font-black text-charcoal md:text-lg">{question}</h3>
                    <span className="mt-1 text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-charcoal/85 md:text-base">{answer}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 leading-7 text-charcoal/80">
              Need a different print method? See our{" "}
              <Link to="/dtf" className="font-semibold text-primary underline">
                DTF printing service
              </Link>
              , or browse{" "}
              <Link to="/blanks" className="font-semibold text-primary underline">
                blank apparel
              </Link>
              . For teamwear, explore our{" "}
              <Link to="/sports-kits" className="font-semibold text-primary underline">
                sports kits
              </Link>
              . If you are ready to discuss a project, visit our{" "}
              <Link to="/contact" className="font-semibold text-primary underline">
                contact page
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-background py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-sm leading-6 text-muted-foreground">
              Product imagery and specifications are reproduced from the dye sublimation catalogue
              supplied for this website. Images are illustrative, actual products may vary, and
              designs shown are visual references only; garments are produced using client-approved
              designs.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SublimationPage;
