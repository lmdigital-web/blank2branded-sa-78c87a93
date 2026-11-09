import { Link } from "@/lib/static-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import dtfPrintingImg from "@/assets/dtf-printing.jpg";
import dtfMeterImg from "@/assets/products/dtf-meter.jpg";
import blankApparelImg from "@/assets/blank-apparel.jpg";
import blankGolfImg from "@/assets/blanks-golf.jpg";
import blankHoodiesImg from "@/assets/blanks-hoodies.jpg";
import sublimationGolfImg from "@/assets/sublimation/mens-golf-shirt.jpg";
import sublimationRugbyImg from "@/assets/sublimation/mens-rugby.jpg";
import sublimationNetballImg from "@/assets/sports-kits/netball-dress.jpg";
import displayImg from "@/assets/display/banner-wall.jpg";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Printer,
  Shirt,
  Truck,
} from "lucide-react";

const WHATSAPP_LINK = `https://wa.me/27698384045?text=${encodeURIComponent(
  "Hi Blank2Branded, I'd like to discuss a quote for apparel, printing or branding.",
)}`;

const services = [
  {
    title: "DTF Transfers",
    description:
      "High-quality, full-colour, ready-to-press DTF transfers, printed to your requirements. Order by the metre or by individual image, with no minimum for standalone transfers.",
    image: dtfPrintingImg,
    imageAlt: "DTF transfer printing in the Blank2Branded workshop",
    href: "/dtf",
    action: "Explore DTF transfers",
    icon: Printer,
  },
  {
    title: "Blank Apparel",
    description:
      "Browse blank T-shirts, golf shirts, hoodies, sweatshirts and other apparel for your business, clothing brand or personal project.",
    image: blankApparelImg,
    imageAlt: "Blank apparel ready for custom branding",
    href: "/blanks",
    action: "Browse blank apparel",
    icon: Shirt,
  },
  {
    title: "Custom Sublimation",
    description:
      "Custom sublimated workwear and sportswear for businesses, schools, clubs, teams and organisations. Fabric suitability depends on the garment.",
    image: sublimationGolfImg,
    imageAlt: "Custom sublimated golf shirt garment style",
    href: "/sublimation",
    action: "Explore sublimation",
    icon: Palette,
    featured: true,
  },
  {
    title: "Corporate Branding & Display",
    description:
      "Explore branded clothing, promotional products, corporate gifts, display and signage solutions for your organisation.",
    image: displayImg,
    imageAlt: "Branded display and signage solution",
    href: "/display",
    action: "Explore branding solutions",
    icon: Building2,
  },
];

const steps = [
  {
    title: "Choose your product or service",
    description: "Start with transfers, blank apparel, sublimation or a branding solution.",
    icon: Shirt,
  },
  {
    title: "Share your requirements",
    description: "Tell us what you need and send your artwork or design brief.",
    icon: FileText,
  },
  {
    title: "Review your quote and artwork",
    description: "Confirm the proposed products, design and quotation with our team.",
    icon: CheckCircle2,
  },
  {
    title: "Production and delivery",
    description: "Once approved, we prepare your order and discuss delivery arrangements.",
    icon: Truck,
  },
];

const reasons = [
  "Based in Mbombela, Mpumalanga, serving customers throughout South Africa.",
  "DTF transfers are produced in-house to your requirements.",
  "Blank apparel and custom sublimation options for different projects.",
  "Support for businesses, clothing brands, teams and individuals.",
  "Direct enquiries through our existing WhatsApp and contact channels.",
];

export function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-muted/30 pt-32 md:pt-36">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-14 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:pb-16 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-charcoal">
              <MapPin className="h-4 w-4 text-primary" />
              Mbombela, Mpumalanga · Nationwide delivery
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
              Custom Apparel, DTF Printing &amp; Branding Solutions in South Africa
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-charcoal/80">
              From blank apparel and ready-to-press DTF transfers to custom sublimated workwear and
              sportswear, Blank2Branded helps South African brands, businesses and teams bring their
              ideas to life. Based in Mbombela, delivering nationwide.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:opacity-90"
              >
                Explore our services <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3.5 font-bold text-charcoal transition hover:border-primary"
              >
                <MessageCircle className="h-4 w-4" />
                Request a quote
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <img
                src={sublimationRugbyImg}
                alt="Sublimated rugby jersey garment"
                width={800}
                height={800}
                fetchPriority="high"
                className="aspect-[4/5] h-full w-full object-cover"
              />
            </figure>
            <div className="grid gap-3 sm:gap-4">
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img
                  src={dtfMeterImg}
                  alt="DTF transfer roll printed to customer requirements"
                  width={800}
                  height={600}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img
                  src={blankGolfImg}
                  alt="Blank golf shirts ready for branding"
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full object-cover"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">What We Do</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
              From blank to branded, with the right solution for your project
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Choose a service to match your needs, whether you are sourcing apparel, preparing
              transfers or creating custom-branded clothing and displays.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.title}
                className={`overflow-hidden rounded-2xl border bg-card ${
                  service.featured
                    ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                <Link
                  to={service.href}
                  className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="p-5">
                    <service.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-black text-charcoal">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                      {service.action} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </article>
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
                <p className="mt-3 text-sm leading-relaxed text-charcoal/85">
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
                <p className="mt-3 text-sm leading-relaxed text-charcoal/85">
                  Premium tees, polos, hoodies and more — held in stock at our
                  Mbombela facility and couriered nationwide. For full designs
                  dyed edge-to-edge into sportswear and team kits, see our{" "}
                  <Link to="/sublimation" className="font-semibold underline hover:text-primary">sublimated clothing range</Link>.
                </p>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATION */}

      <section className="border-y border-border bg-charcoal py-16 text-background md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-background/65">
              Featured service
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Custom Sublimated Clothing for Businesses, Teams &amp; Organisations
            </h2>
            <p className="mt-4 leading-7 text-background/80">
              Explore custom sublimated golf shirts, work T-shirts, rugby jerseys, soccer kits,
              netball dresses and other suitable polyester-based apparel. Full-colour designs,
              detailed graphics and branding can be incorporated into the garment design; fabric
              suitability varies by style.
            </p>
            <p className="mt-3 leading-7 text-background/80">
              We work with businesses, schools, sports clubs, teams and organisations from Mbombela
              and throughout South Africa.
            </p>
            <Link
              to="/sublimation"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:opacity-90"
            >
              Explore custom sublimation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sports-kits"
              className="mt-4 inline-flex items-center gap-2 font-bold text-background underline underline-offset-4"
            >
              Browse sports kits
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                src: sublimationGolfImg,
                alt: "Custom sublimated golf shirt style",
                label: "Corporate apparel",
              },
              {
                src: sublimationRugbyImg,
                alt: "Custom sublimated rugby jersey style",
                label: "Rugby teamwear",
              },
              {
                src: sublimationNetballImg,
                alt: "Custom netball dress style",
                label: "Netball teamwear",
              },
            ].map((item) => (
              <figure
                key={item.label}
                className="overflow-hidden rounded-xl border border-background/15 bg-background/5"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  width={600}
                  height={750}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
                <figcaption className="px-2 py-3 text-center text-xs font-semibold sm:text-sm">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 md:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={dtfPrintingImg}
              alt="DTF transfers being printed in the Blank2Branded workshop"
              width={1280}
              height={960}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              DTF Transfers
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
              DTF printing in South Africa, made to your requirements
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              We produce DTF transfers in-house. Order standalone transfers by the metre or by
              individual image, in the quantity you need, with no minimum order. Courier delivery is
              available at the customer's expense.
            </p>
            <Link
              to="/dtf"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:opacity-90"
            >
              Explore DTF transfers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Blank Apparel
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
                Start with the garments you need
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Browse available blank T-shirts, golf shirts, hoodies, sweatshirts and more in our
                product ranges and online shop.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/blanks"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-bold text-charcoal transition hover:border-primary"
              >
                View blank apparel
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:opacity-90"
              >
                Shop apparel <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                src: blankApparelImg,
                alt: "Blank T-shirts and apparel",
                label: "T-shirts & apparel",
              },
              { src: blankGolfImg, alt: "Blank golf shirts", label: "Golf shirts" },
              {
                src: blankHoodiesImg,
                alt: "Blank hoodies and sweatshirts",
                label: "Hoodies & sweatshirts",
              },
            ].map((item) => (
              <Link
                key={item.label}
                to="/blanks"
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  width={900}
                  height={675}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="flex items-center justify-between p-4 font-bold text-charcoal">
                  {item.label} <ArrowRight className="h-4 w-4 text-primary" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Corporate &amp; Business Solutions
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
              Branding support for your business
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Explore staff clothing, branded workwear, custom golf shirts, promotional apparel,
              corporate gifts, display and signage. Tell us about your organisation and what you
              want to brand; we can help you find an appropriate option from our available services.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:opacity-90"
              >
                Discuss your branding requirements <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/catalogues"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 font-bold text-charcoal transition hover:border-primary"
              >
                Browse corporate catalogues
              </Link>
            </div>
          </div>
          <Link
            to="/display"
            className="group overflow-hidden rounded-2xl border border-border bg-card"
          >
            <img
              src={displayImg}
              alt="Branded display and signage for business events"
              width={1200}
              height={900}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="flex items-center justify-between p-4 font-bold text-charcoal">
              Display and signage solutions <ArrowRight className="h-4 w-4 text-primary" />
            </span>
          </Link>
        </div>
      </section>

      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
              A clear path from idea to delivery
            </h2>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <step.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span className="text-sm font-black text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-black text-charcoal">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Why Blank2Branded?
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">
              Complete custom apparel, printing &amp; branding solutions
            </h2>
            <ul className="mt-6 space-y-4">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-charcoal/85">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <MapPin className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-black text-charcoal">Based in Mbombela</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Serving customers across Mpumalanga and throughout South Africa.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <Truck className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-black text-charcoal">Nationwide delivery</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Courier delivery options are available for customers around the country.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:col-span-2">
              <Package className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-black text-charcoal">Talk directly with our team</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Contact us with your requirements and we can discuss the available products and
                services for your project.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-2 font-bold text-primary underline"
              >
                Contact Blank2Branded <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="bg-charcoal py-16 text-background md:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-background/65">
            Your next project starts here
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Ready to Bring Your Brand to Life?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-background/80">
            Whether you need DTF transfers, blank apparel, custom sublimated clothing or complete
            branding solutions, Blank2Branded is ready to help.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Request a quote
            </a>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-lg border border-background/30 px-6 py-3.5 font-bold text-background transition hover:bg-background/10"
            >
              Browse our shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
