import { ArrowRight, Check, MessageCircle, Palette, Shirt, Sparkles, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import sublimationHeroBg from "@/assets/sublimation-hero-bg.jpg";

import mensGolfShirt from "@/assets/sublimation/mens-golf-shirt.jpg";
import mensCrewTshirt from "@/assets/sublimation/mens-crew-tshirt.jpg";
import mensLongTshirt from "@/assets/sublimation/mens-long-tshirt.jpg";
import mensVneckTshirt from "@/assets/sublimation/mens-vneck-tshirt.jpg";
import mensCrewVest from "@/assets/sublimation/mens-crew-vest.jpg";
import mensVneckVest from "@/assets/sublimation/mens-vneck-vest.jpg";
import mensLongGolf from "@/assets/sublimation/mens-long-golf.jpg";
import mensRugby from "@/assets/sublimation/mens-rugby.jpg";
import cyclingTop from "@/assets/sublimation/cycling-top.jpg";
import soccerShorts from "@/assets/sublimation/soccer-shorts.jpg";
import mensCrewTshirtShortsSet from "@/assets/sublimation/mens-crew-tshirt-shorts-set.jpg";
import mensCrewVestShortsSet from "@/assets/sublimation/mens-crew-vest-shorts-set.jpg";
import vneckVestShortsSet from "@/assets/sublimation/vneck-vest-shorts-set.jpg";

import ladiesGolfShirt from "@/assets/sublimation/ladies-golf-shirt.jpg";
import ladiesLongGolf from "@/assets/sublimation/ladies-long-golf.jpg";
import ladiesCrewTshirt from "@/assets/sublimation/ladies-crew-tshirt.jpg";
import ladiesLongTshirt from "@/assets/sublimation/ladies-long-tshirt.jpg";
import ladiesSkirt from "@/assets/sublimation/ladies-skirt.jpg";
import ladiesCrewVestSkirtSet from "@/assets/sublimation/ladies-crew-vest-skirt-set.jpg";

import kidsGolfShirt from "@/assets/sublimation/kids-golf-shirt.jpg";
import kidsLongGolf from "@/assets/sublimation/kids-long-golf.jpg";
import kidsCrewTshirt from "@/assets/sublimation/kids-crew-tshirt.jpg";
import kidsLongTshirt from "@/assets/sublimation/kids-long-tshirt.jpg";
import kidsCrewVest from "@/assets/sublimation/kids-crew-vest.jpg";
import kidsRugby from "@/assets/sublimation/kids-rugby.jpg";
import kidsSkirt from "@/assets/sublimation/kids-skirt.jpg";
import kidsCrewTshirtShortsSet from "@/assets/sublimation/kids-crew-tshirt-shorts-set.jpg";
import kidsCrewVestSkirtSet from "@/assets/sublimation/kids-crew-vest-skirt-set.jpg";

const WHATSAPP_NUMBER = "27698384045";

type Product = {
  name: string;
  description: string;
  image?: string;
  badge?: string;
};

type Category = {
  id: string;
  title: string;
  description: string;
  products: Product[];
};

const mensProducts: Product[] = [
  {
    name: "Crew Neck T-Shirt",
    description: "Men's crew neck style with raglan sleeve construction. Available in short and long sleeve options.",
    image: mensCrewTshirt,
  },
  {
    name: "V-Neck T-Shirt",
    description: "Men's V-neck style with raglan sleeves and double top-stitched construction.",
    image: mensVneckTshirt,
  },
  {
    name: "Golf Shirt",
    description: "Custom dye-sublimated men's golfer designed for branded teams, clubs and events.",
    image: mensGolfShirt,
  },
  {
    name: "Long Sleeve Golf Shirt",
    description: "Long sleeve golfer option for teams and organisations requiring additional coverage.",
    image: mensLongGolf,
  },
  {
    name: "Long Sleeve T-Shirt",
    description: "Full-length sleeve sublimation option for training, sport and lifestyle applications.",
    image: mensLongTshirt,
  },
  {
    name: "Crew Neck Vest",
    description: "Sleeveless crew neck design suited to training, athletics and active events.",
    image: mensCrewVest,
  },
  {
    name: "V-Neck Vest",
    description: "Sleeveless V-neck option for lightweight sporting and event apparel.",
    image: mensVneckVest,
  },
  {
    name: "Rugby Jersey",
    description: "Custom rugby apparel for clubs, schools, teams and sporting events.",
    image: mensRugby,
    badge: "Team Sport",
  },
  {
    name: "Cycling Top",
    description: "Performance-focused cycling apparel with a fully customisable sublimated design.",
    image: cyclingTop,
    badge: "Performance",
  },
  {
    name: "Soccer Shorts",
    description: "Custom sporting shorts for football and other active team applications.",
    image: soccerShorts,
  },
  {
    name: "T-Shirt & Shorts Set",
    description: "Coordinated sublimated apparel set for teams, clubs and events.",
    image: mensCrewTshirtShortsSet,
  },
  {
    name: "Vest & Shorts Set",
    description: "Matching vest and shorts combination for athletics and active teamwear.",
    image: mensCrewVestShortsSet,
  },
  {
    name: "V-Neck Vest & Shorts Set",
    description: "Complete sporting set combining a V-neck vest with matching shorts.",
    image: vneckVestShortsSet,
  },
  {
    name: "Warm-Up",
    description: "Men's warm-up apparel with a front quarter zip and raglan sleeve construction.",
    badge: "Training",
  },
  {
    name: "Hooded T-Shirt",
    description: "Full dye-sublimation hooded T-shirt option for teams, events and lifestyle apparel.",
    badge: "Lifestyle",
  },
  {
    name: "Sports Bib",
    description: "Lightweight sports bib option suitable for organised sporting activities.",
    badge: "Team Sport",
  },
  {
    name: "Cricket Pullover",
    description: "Cricket pullover featuring a self-fabric armhole and collar insert.",
    badge: "Cricket",
  },
  {
    name: "Sublimated Lounge Shirt",
    description: "Button-down shirt with fitted sleeves and sublimated collar detailing.",
    badge: "Lifestyle",
  },
  {
    name: "Cricket Pants",
    description: "Custom cricket bottom designed as part of the specialist sports range.",
    badge: "Cricket",
  },
  {
    name: "Athletic Shorts",
    description: "Custom sports shorts for training, athletics and active events.",
  },
  {
    name: "Rugby Shorts",
    description: "Rugby shorts with options including elasticated waistband and drawcord construction.",
    badge: "Rugby",
  },
  {
    name: "Golf Shorts",
    description: "Custom golf shorts designed to coordinate with sublimated golf apparel.",
    badge: "Golf",
  },
];

const ladiesProducts: Product[] = [
  {
    name: "Crew Neck T-Shirt",
    description: "Ladies' cut crew neck style with raglan sleeves. Available in short and long sleeve options.",
    image: ladiesCrewTshirt,
  },
  {
    name: "V-Neck T-Shirt",
    description: "Ladies' fitted V-neck style with double top-stitched hem and sleeve construction.",
    image: ladiesLongTshirt,
  },
  {
    name: "Golf Shirt",
    description: "Ladies' fitted golfer with a choice of 3-button placket or zip option.",
    image: ladiesGolfShirt,
    badge: "Golf",
  },
  {
    name: "Long Sleeve Golf Shirt",
    description: "Ladies' long sleeve golfer option for clubs, teams and branded events.",
    image: ladiesLongGolf,
    badge: "Golf",
  },
  {
    name: "Crew Neck Vest",
    description: "Ladies' crew neck sleeveless style with self-fabric binding on armholes and neck.",
    badge: "Training",
  },
  {
    name: "Crop Top",
    description: "Custom ladies' crop top designed for active and sporting applications.",
    badge: "Performance",
  },
  {
    name: "Golf Dress",
    description: "Custom golf dress option for clubs, tournaments and corporate golf events.",
    badge: "Golf",
  },
  {
    name: "Sport Dress",
    description: "Custom sporting dress for teams, events and active applications.",
    badge: "Team Sport",
  },
  {
    name: "Sleeveless Golfer Dress",
    description: "Sleeveless ladies' golfer dress with a 3-button placket or zip option and rounded collar edges.",
    badge: "Golf",
  },
  {
    name: "Warm-Up",
    description: "Ladies' warm-up option for training, teams and event apparel.",
    badge: "Training",
  },
  {
    name: "Skirt",
    description: "Custom sublimated ladies' skirt for sport, golf and coordinated teamwear.",
    image: ladiesSkirt,
  },
  {
    name: "Skort",
    description: "A-line skirt with elasticated waist and inner hot pants stitched into the skirt.",
    badge: "Sport",
  },
  {
    name: "Compression Shorts",
    description: "Custom compression shorts for active and sporting applications.",
    badge: "Performance",
  },
  {
    name: "Hot Pants",
    description: "Custom sublimated hot pants for activewear and sporting applications.",
    badge: "Performance",
  },
  {
    name: "Tights",
    description: "Custom sublimated tights available as knee, 3/4 and full-length options.",
    badge: "Performance",
  },
  {
    name: "Vest & Skirt Set",
    description: "Coordinated ladies' vest and skirt combination for teams and events.",
    image: ladiesCrewVestSkirtSet,
  },
];

const kidsProducts: Product[] = [
  {
    name: "Crew Neck T-Shirt",
    description: "Kids' crew neck option for teamwear, clubs and events.",
    image: kidsCrewTshirt,
  },
  {
    name: "Long Sleeve T-Shirt",
    description: "Kids' long sleeve sublimated T-shirt for sporting and event use.",
    image: kidsLongTshirt,
  },
  {
    name: "Golf Shirt",
    description: "Kids' golfer for junior golf clubs, schools, teams and events.",
    image: kidsGolfShirt,
    badge: "Golf",
  },
  {
    name: "Long Sleeve Golf Shirt",
    description: "Kids' long sleeve golfer option for junior teams and clubs.",
    image: kidsLongGolf,
    badge: "Golf",
  },
  {
    name: "Crew Neck Vest",
    description: "Kids' sleeveless crew neck option for active and sporting applications.",
    image: kidsCrewVest,
  },
  {
    name: "Rugby Jersey",
    description: "Custom junior rugby apparel for schools, clubs and teams.",
    image: kidsRugby,
    badge: "Rugby",
  },
  {
    name: "Skirt",
    description: "Custom sublimated junior skirt for coordinated teamwear.",
    image: kidsSkirt,
  },
  {
    name: "T-Shirt & Shorts Set",
    description: "Matching junior T-shirt and shorts set for sporting teams and events.",
    image: kidsCrewTshirtShortsSet,
  },
  {
    name: "Vest & Skirt Set",
    description: "Coordinated junior vest and skirt set for teams and events.",
    image: kidsCrewVestSkirtSet,
  },
];

const categories: Category[] = [
  {
    id: "mens",
    title: "Men's Dye Sublimation",
    description:
      "A broad range of customisable men's apparel covering golf, training, team sport, performance and lifestyle.",
    products: mensProducts,
  },
  {
    id: "ladies",
    title: "Ladies' Dye Sublimation",
    description:
      "Ladies' cut apparel designed around sport, golf, training, performance and coordinated teamwear.",
    products: ladiesProducts,
  },
  {
    id: "kids",
    title: "Kids' Dye Sublimation",
    description:
      "Junior apparel for schools, clubs, teams and events, with kids' sizing available across selected styles.",
    products: kidsProducts,
  },
];

const materialOptions = [
  "Reverse Birdseye 140G",
  "Birdseye 140G",
  "Sport Tec 140G",
  "Drop Needle Square 130G",
];

const specialMaterials = [
  "Triacetate 220G",
  "Poly Cotton 110G",
  "Gabardine",
  "Poly Lycra 240G",
];

const quoteLink = (product?: string) => {
  const message = product
    ? `Hi, I would like a quote for Dye Sublimation ${product}.`
    : "Hi, I would like a quote for custom Dye Sublimation apparel.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {product.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {product.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
              {product.badge}
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-dtf">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full border-2 border-white" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full border-2 border-white" />
          </div>

          <div className="relative text-center text-white">
            <Shirt className="mx-auto mb-3 h-10 w-10" />
            <span className="text-sm font-semibold">Custom Dye Sublimation</span>
          </div>

          {product.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
              {product.badge}
            </span>
          )}
        </div>
      )}

      <div className="p-5">
        <h3 className="text-lg font-bold text-charcoal">{product.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description}</p>

        <a
          href={quoteLink(product.name)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Request a quote
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-extrabold tracking-tight text-charcoal md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{description}</p>
    </div>
  );
}

export default function SublimationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={sublimationHeroBg}
              alt=""
              className="h-full w-full object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32 lg:py-40">
            <div className="max-w-4xl text-white">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Custom Dye Sublimation
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
                Your Design.
                <span className="block text-gradient-dtf">Our Technology.</span>
                <span className="block">Your Masterpiece.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 md:text-xl">
                Custom dye-sublimated apparel for sport, golf, teams, events, training,
                corporate programmes and lifestyle applications.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#range"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-charcoal transition hover:bg-white/90"
                >
                  Explore the range
                  <ArrowRight className="h-5 w-5" />
                </a>

                <a
                  href={quoteLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <MessageCircle className="h-5 w-5" />
                  Get a quote
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                  Dye Sublimation Range
                </p>

                <h2 className="text-3xl font-extrabold tracking-tight text-charcoal md:text-5xl">
                  Apparel made around your design
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  The National Flag dye sublimation catalogue covers a specialist range of
                  apparel for men, ladies and kids, including sporting, golf, training and
                  lifestyle styles.
                </p>

                <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                  Garments are produced using client-approved designs, allowing your branding,
                  colours and artwork to become part of the finished garment.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  {
                    icon: Palette,
                    title: "Your Design",
                    text: "Build the garment around your approved artwork and branding.",
                  },
                  {
                    icon: Trophy,
                    title: "Built for Teams",
                    text: "Ideal for clubs, schools, events, sporting teams and organisations.",
                  },
                  {
                    icon: Shirt,
                    title: "Wide Range",
                    text: "Choose from tops, bottoms, dresses, sets, warm-ups and accessories.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <item.icon className="h-7 w-7 text-primary" />
                    <h3 className="mt-3 font-bold text-charcoal">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick navigation */}
        <section id="range" className="scroll-mt-24 bg-muted/40">
          <div className="mx-auto max-w-7xl px-6 py-14 md:px-8">
            <SectionHeading
              eyebrow="Explore the range"
              title="Choose your apparel category"
              description="Browse the specialist styles available across men's, ladies' and kids' dye sublimation."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Shirt className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-charcoal">{category.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>

                  <p className="mt-4 text-sm font-semibold text-primary">
                    {category.products.length} styles shown
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Men's */}
        <section id="mens" className="scroll-mt-24 bg-background">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <SectionHeading
              eyebrow="Men's range"
              title="Men's Dye Sublimation"
              description="From golfers and training tops to rugby, cycling, cricket and coordinated sporting sets."
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mensProducts.map((product) => (
                <ProductCard key={product.name} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Ladies */}
        <section id="ladies" className="scroll-mt-24 bg-muted/40">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <SectionHeading
              eyebrow="Ladies' range"
              title="Ladies' Dye Sublimation"
              description="Fitted apparel for golf, sport, training, performance and coordinated teamwear."
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ladiesProducts.map((product) => (
                <ProductCard key={product.name} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Kids */}
        <section id="kids" className="scroll-mt-24 bg-background">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <SectionHeading
              eyebrow="Kids' range"
              title="Kids' Dye Sublimation"
              description="Junior apparel for schools, clubs, teams and sporting events."
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {kidsProducts.map((product) => (
                <ProductCard key={product.name} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Materials */}
        <section className="bg-charcoal text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                  Material options
                </p>

                <h2 className="text-3xl font-extrabold md:text-4xl">
                  Choose the construction for your application
                </h2>

                <p className="mt-5 max-w-xl leading-7 text-white/70">
                  The catalogue lists different material options across the apparel range.
                  Material availability depends on the selected garment.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {materialOptions.map((material) => (
                    <div
                      key={material}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm font-semibold">{material}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
                <h3 className="text-xl font-bold">Additional materials shown in the range</h3>

                <div className="mt-5 space-y-3">
                  {specialMaterials.map((material) => (
                    <div
                      key={material}
                      className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm text-white/80">{material}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm leading-6 text-white/55">
                  Material options vary by garment. Ask us which construction is available for
                  the style you want.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sizes */}
        <section className="bg-background">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <SectionHeading
              eyebrow="Sizing"
              title="Designed for teams of all ages"
              description="The catalogue includes kids' and adult sizing across many of the core sublimation styles."
            />

            <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Kids / Kiddies
                </p>
                <p className="mt-3 text-3xl font-black text-charcoal">Age 3–14</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Available on selected styles.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">Adults</p>
                <p className="mt-3 text-3xl font-black text-charcoal">XS–5XL</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Available on selected styles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Arm sleeves */}
        <section className="bg-muted/40">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="rounded-3xl bg-gradient-dtf p-8 text-white md:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles className="h-7 w-7" />
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                  Unisex accessory
                </p>

                <h2 className="mt-2 text-3xl font-black md:text-4xl">Arm Sleeves</h2>

                <p className="mt-4 leading-7 text-white/80">
                  A customisable accessory designed to complement sporting apparel and team
                  branding.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-charcoal">Arm Sleeve features</h3>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Inner elastic",
                    "Stretch material",
                    "UV protected",
                    "Sold in pairs",
                    "Poly Lycra 240G",
                    "Standard length: 26CM",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm font-semibold text-charcoal">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Applications */}
        <section className="bg-background">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <SectionHeading
              eyebrow="Built around your needs"
              title="From the field to the fairway"
              description="Dye sublimation can be used across a wide range of branded apparel applications."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Sports Teams",
                "Golf Clubs",
                "Schools",
                "Corporate Events",
                "Training",
                "Motorsport",
                "Lifestyle",
                "Events",
              ].map((application) => (
                <div
                  key={application}
                  className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
                >
                  <span className="font-bold text-charcoal">{application}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-charcoal">
          <div className="absolute inset-0 bg-gradient-dtf opacity-90" />

          <div className="relative mx-auto max-w-5xl px-6 py-16 text-center text-white md:px-8 md:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
              Ready to create yours?
            </p>

            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Bring your design to life.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
              Tell us which style you need, send us your artwork and we'll help you take the
              next step toward your custom dye-sublimated apparel.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={quoteLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-charcoal transition hover:bg-white/90"
              >
                <MessageCircle className="h-5 w-5" />
                Request a quote
              </a>

              <a
                href="#range"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-bold text-white transition hover:bg-white/20"
              >
                Browse the range
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}