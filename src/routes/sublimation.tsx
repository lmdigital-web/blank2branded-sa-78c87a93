import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, MessageCircle } from "lucide-react";
import sublimationHeroBg from "@/assets/sublimation-hero-bg.jpg";

import mensGolf from "@/assets/sublimation/mens-golf-shirt.jpg";
import mensCrewTee from "@/assets/sublimation/mens-crew-tshirt.jpg";
import ladiesGolf from "@/assets/sublimation/ladies-golf-shirt.jpg";
import mensRugby from "@/assets/sublimation/mens-rugby.jpg";
import soccerShorts from "@/assets/sublimation/soccer-shorts.jpg";
import kidsGolf from "@/assets/sublimation/kids-golf-shirt.jpg";
import mensLongGolf from "@/assets/sublimation/mens-long-golf.jpg";
import kidsCrewTee from "@/assets/sublimation/kids-crew-tshirt.jpg";
import ladiesCrewTee from "@/assets/sublimation/ladies-crew-tshirt.jpg";
import mensCrewVest from "@/assets/sublimation/mens-crew-vest.jpg";
import mensLongTee from "@/assets/sublimation/mens-long-tshirt.jpg";
import mensVneckTee from "@/assets/sublimation/mens-vneck-tshirt.jpg";
import kidsRugby from "@/assets/sublimation/kids-rugby.jpg";
import cyclingTop from "@/assets/sublimation/cycling-top.jpg";
import kidsSkirt from "@/assets/sublimation/kids-skirt.jpg";
import ladiesSkirt from "@/assets/sublimation/ladies-skirt.jpg";
import ladiesLongGolf from "@/assets/sublimation/ladies-long-golf.jpg";
import kidsCrewVest from "@/assets/sublimation/kids-crew-vest.jpg";
import kidsLongTee from "@/assets/sublimation/kids-long-tshirt.jpg";
import ladiesLongTee from "@/assets/sublimation/ladies-long-tshirt.jpg";
import kidsLongGolf from "@/assets/sublimation/kids-long-golf.jpg";
import mensVneckVest from "@/assets/sublimation/mens-vneck-vest.jpg";
import vneckVestShortsSet from "@/assets/sublimation/vneck-vest-shorts-set.jpg";
import kidsCrewTeeShortsSet from "@/assets/sublimation/kids-crew-tshirt-shorts-set.jpg";
import mensCrewTeeShortsSet from "@/assets/sublimation/mens-crew-tshirt-shorts-set.jpg";
import ladiesCrewVestSkirtSet from "@/assets/sublimation/ladies-crew-vest-skirt-set.jpg";
import kidsCrewVestSkirtSet from "@/assets/sublimation/kids-crew-vest-skirt-set.jpg";
import mensCrewVestShortsSet from "@/assets/sublimation/mens-crew-vest-shorts-set.jpg";

type SublimationProduct = {
  title: string;
  image: string;
  description: string;
};

const MENS: SublimationProduct[] = [
  {
    title: "Mens Golf Shirt Custom Design",
    image: mensGolf,
    description:
      "Full-colour all-over sublimated men's golf shirt. Print edge-to-edge with your team, club or brand design — vibrant, breathable and fade-proof.",
  },
  {
    title: "Mens Crew Neck T-Shirt Custom Design",
    image: mensCrewTee,
    description:
      "Classic men's crew neck tee with all-over sublimation print. Soft, breathable polyester perfect for events, teams, fan kits and merch drops.",
  },
  {
    title: "Mens Long Sleeve Golf Shirt Custom Design",
    image: mensLongGolf,
    description:
      "Long sleeve sublimated golf shirt for cooler days on the course or boardroom. Edge-to-edge custom print on premium poly performance fabric.",
  },
  {
    title: "Mens Crew Neck Vest Custom Design",
    image: mensCrewVest,
    description:
      "Sleeveless crew neck vest with full-colour sublimation. Lightweight and breathable — ideal for gym, running, soccer warm-ups and active brands.",
  },
  {
    title: "Mens Long Sleeve T-Shirt Custom Design",
    image: mensLongTee,
    description:
      "All-over printed long sleeve tee. Bold edge-to-edge design with no fading, no cracking — built for layering, sport and statement merch.",
  },
  {
    title: "Mens V-Neck T-Shirt Custom Design",
    image: mensVneckTee,
    description:
      "Modern v-neck cut with all-over sublimation. Soft, lightweight polyester that holds vivid colour wash after wash.",
  },
  {
    title: "Mens V-Neck Vest Custom Design",
    image: mensVneckVest,
    description:
      "V-neck sleeveless vest with full custom print. Cool, breathable and perfect for summer events, gym teams and active streetwear lines.",
  },
  {
    title: "Rugby Jersey Custom Design",
    image: mensRugby,
    description:
      "Custom sublimated rugby jersey with reinforced stitching and team colour blocking. Numbers, names, sponsors — all baked into the fabric, never to peel.",
  },
  {
    title: "Soccer Shorts Custom Design",
    image: soccerShorts,
    description:
      "Custom sublimated soccer shorts with elasticated waistband. Match your team kit perfectly — full-colour print with no limits.",
  },
  {
    title: "Cycling Top Custom Design",
    image: cyclingTop,
    description:
      "Aerodynamic cycling jersey with full-zip front. All-over sublimation for clubs, charity rides and sponsor branding — moisture-wicking poly fabric.",
  },
  {
    title: "Mens Crew Neck T-Shirt & Shorts Set Custom Design",
    image: mensCrewTeeShortsSet,
    description:
      "Matching men's crew neck tee and shorts set — coordinated all-over print top to bottom. Perfect for sports teams, gyms and brand uniforms.",
  },
  {
    title: "Mens Crew Neck Vest & Shorts Set Custom Design",
    image: mensCrewVestShortsSet,
    description:
      "Matching crew neck vest and shorts set with coordinated sublimation print. Lightweight, breathable kit for running clubs, gyms and basketball.",
  },
  {
    title: "V-Neck Vest & Shorts Set Custom Design",
    image: vneckVestShortsSet,
    description:
      "Coordinated v-neck vest and shorts set with full custom sublimation. Sharp, athletic look for active brands and sports clubs.",
  },
];

const LADIES: SublimationProduct[] = [
  {
    title: "Ladies Golf Shirt Custom Design",
    image: ladiesGolf,
    description:
      "Fitted ladies golf shirt with all-over sublimation print. Flattering cut, breathable poly fabric and edge-to-edge custom design.",
  },
  {
    title: "Ladies Long Sleeve Golf Shirt Custom Design",
    image: ladiesLongGolf,
    description:
      "Long sleeve fitted ladies golf shirt with full-colour custom sublimation. Great for cooler weather golf days and corporate teams.",
  },
  {
    title: "Ladies Crew Neck T-Shirt Custom Design",
    image: ladiesCrewTee,
    description:
      "Fitted ladies crew neck tee with all-over print. Soft poly fabric that keeps its shape and colour through every wash.",
  },
  {
    title: "Ladies Long Sleeve T-Shirt Custom Design",
    image: ladiesLongTee,
    description:
      "Fitted ladies long sleeve tee with full sublimation print. Layer it or wear it solo — vivid colour, edge-to-edge design.",
  },
  {
    title: "Ladies Skirt Custom Design",
    image: ladiesSkirt,
    description:
      "Sublimated ladies sports skirt with elasticated waist. Match it to a top or wear standalone — full-colour custom print.",
  },
  {
    title: "Ladies Crew Neck Vest & Skirt Set Custom Design",
    image: ladiesCrewVestSkirtSet,
    description:
      "Matching ladies vest and skirt set with coordinated all-over sublimation. Perfect for netball, running clubs and team kits.",
  },
];

const KIDS: SublimationProduct[] = [
  {
    title: "Kiddies Golf Shirt Custom Design",
    image: kidsGolf,
    description:
      "Kids golf shirt with bright all-over sublimation print. Junior team kits, school colours and family brand sets — built for active play.",
  },
  {
    title: "Kiddies Long Sleeve Golf Shirt Custom Design",
    image: kidsLongGolf,
    description:
      "Long sleeve kids golf shirt with full-colour custom print. Great for school teams, junior clubs and cooler-weather kits.",
  },
  {
    title: "Kiddies Crew Neck T-Shirt Custom Design",
    image: kidsCrewTee,
    description:
      "Kids crew neck tee with edge-to-edge sublimation. Soft, breathable and fade-proof — perfect for school teams, parties and brand sets.",
  },
  {
    title: "Kiddies Long Sleeve T-Shirt Custom Design",
    image: kidsLongTee,
    description:
      "Kids long sleeve tee with vibrant all-over print. Comfortable poly fabric that keeps its colour through play and washing.",
  },
  {
    title: "Kiddies Crew Neck Vest Custom Design",
    image: kidsCrewVest,
    description:
      "Sleeveless kids crew vest with full sublimation. Cool and breathable — great for summer sports, school athletics and active days out.",
  },
  {
    title: "Kiddies Rugby Jersey Custom Design",
    image: kidsRugby,
    description:
      "Junior rugby jersey with custom team print, numbers and names baked into the fabric. Tough, reinforced stitching for school and club teams.",
  },
  {
    title: "Kiddies Skirt Custom Design",
    image: kidsSkirt,
    description:
      "Kids sports skirt with all-over sublimation. Bright, fun and durable — perfect for netball, hockey and gymnastics teams.",
  },
  {
    title: "Kiddies Crew Neck T-Shirt & Shorts Set Custom Design",
    image: kidsCrewTeeShortsSet,
    description:
      "Matching kids tee and shorts set with coordinated print. Ideal for junior teams, school athletics and matching family kits.",
  },
  {
    title: "Kiddies Crew Neck Vest & Skirt Set Custom Design",
    image: kidsCrewVestSkirtSet,
    description:
      "Matching kids vest and skirt set with full coordinated sublimation. Bright, fun and ready for the field, court or pavement.",
  },
];

const CATEGORIES: { id: string; label: string; tagline: string; products: SublimationProduct[] }[] = [
  { id: "mens", label: "Mens", tagline: "Bold, breathable and built for performance.", products: MENS },
  { id: "ladies", label: "Ladies", tagline: "Fitted cuts and vivid prints — designed for her.", products: LADIES },
  { id: "kids", label: "Kids", tagline: "Bright, durable and ready for the playground.", products: KIDS },
];

const WA_NUMBER = "27698384045";

function quoteLink(title: string) {
  const message = `Hi Blank2Branded, I'd like a quote for: ${title}. Please send me pricing and lead time.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function ProductCard({ p }: { p: SublimationProduct }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-black leading-tight text-charcoal">{p.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
        <a
          href={quoteLink(p.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
        >
          Request Quote <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

export function SublimationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={sublimationHeroBg}
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
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Sublimation Apparel</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">Edge-to-edge</span> custom kits.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Full-colour sublimation printed apparel for Mens, Ladies and Kids — golf shirts, jerseys, tees, vests, shorts and sets. Your design, baked into the fabric. Request a quote on any item and we'll come back within 4 business hours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-charcoal transition-all hover:border-primary hover:text-primary"
              >
                {c.label}
              </a>
            ))}
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Blank2Branded, I'd like a quote on sublimation apparel.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-dtf px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              <MessageCircle className="h-4 w-4" />
              Quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {CATEGORIES.map((cat) => (
        <section key={cat.id} id={cat.id} className="border-b border-border py-16 md:py-20 last:border-b-0">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-magenta">Category</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-charcoal md:text-5xl">{cat.label}</h2>
                <p className="mt-2 text-base text-muted-foreground">{cat.tagline}</p>
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                {cat.products.length} product{cat.products.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cat.products.map((p) => (
                <ProductCard key={p.title} p={p} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <Footer />
    </main>
  );
}
