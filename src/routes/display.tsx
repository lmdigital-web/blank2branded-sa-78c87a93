import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, MessageCircle } from "lucide-react";

import displayHeroBg from "@/assets/display-hero-bg.jpg";
import gazebo from "@/assets/display/gazebo.jpg";
import bannerWall from "@/assets/display/banner-wall.jpg";
import harpBanner from "@/assets/display/harp-banner.jpg";
import pullUp from "@/assets/display/pull-up-banner.jpg";
import tableCloth from "@/assets/display/table-cloth.jpg";
import fenceWrap from "@/assets/display/fence-wrap.jpg";
import corporateFlags from "@/assets/display/corporate-flags.jpg";
import telescopic from "@/assets/display/telescopic-banner.jpg";
import popUp from "@/assets/display/pop-up-banner.jpg";
import slimWall from "@/assets/display/slim-banner-wall.jpg";
import lantern from "@/assets/display/lantern-banner.jpg";
import aFrame from "@/assets/display/a-frame.jpg";
import umbrella from "@/assets/display/sliding-umbrella.jpg";
import pennants from "@/assets/display/pennants.jpg";
import horseshoe from "@/assets/display/horseshoe-banner.jpg";

type DisplayProduct = {
  title: string;
  image: string;
  description: string;
};

const PRODUCTS: DisplayProduct[] = [
  {
    title: "Gazebos",
    image: gazebo,
    description:
      "Heavy-duty branded gazebos for markets, expos and outdoor activations. Full-colour printed canopies, walls and valances — built to handle SA weather.",
  },
  {
    title: "Banner Walls",
    image: bannerWall,
    description:
      "Large-format backdrop walls for stages, photo ops and exhibition stands. Seamless full-colour print on durable tension fabric with sturdy frames.",
  },
  {
    title: "Harp Banners",
    image: harpBanner,
    description:
      "Eye-catching teardrop harp flags that stay readable in the wind. Includes pole, base options (cross, water, spike) and a vivid double-sided print.",
  },
  {
    title: "Pull Up Banners",
    image: pullUp,
    description:
      "Classic retractable roller banners — set up in seconds. Available in 850mm, 1000mm and 1200mm widths with carry bag included.",
  },
  {
    title: "Branded Table Cloths",
    image: tableCloth,
    description:
      "Fitted or draped table covers fully printed with your branding. Perfect for trade shows, corporate events and pop-up stalls.",
  },
  {
    title: "Fence Wrap",
    image: fenceWrap,
    description:
      "Large mesh banners with wind-resistant perforations — ideal for stadium fences, construction hoardings and event perimeters.",
  },
  {
    title: "Corporate Flags",
    image: corporateFlags,
    description:
      "Custom company flags for flagpoles, building entrances and showrooms. Printed on premium flag knit with reinforced stitching.",
  },
  {
    title: "Telescopic Banners",
    image: telescopic,
    description:
      "Adjustable-height feather banners with telescopic poles. Easy to transport and set up — great for outdoor promotions and sports days.",
  },
  {
    title: "Pop Up Banners",
    image: popUp,
    description:
      "Curved or straight pop-up display stands with magnetic bars and full-colour graphics. Sets up in under 5 minutes for clean stand-out booths.",
  },
  {
    title: "Slim Line Banner Wall",
    image: slimWall,
    description:
      "Lightweight slim-line modular walls — quick assembly, premium finish. Ideal for boardroom backdrops and exhibition stands where space is tight.",
  },
  {
    title: "Lantern Banner",
    image: lantern,
    description:
      "Hanging lantern-style fabric banners that grab attention from any angle. Perfect for indoor activations, malls and ceiling-mounted displays.",
  },
  {
    title: "A-Frame Banners",
    image: aFrame,
    description:
      "Double-sided pavement A-frames for storefronts and sidewalks. Weighted base, weather-resistant print — direct foot traffic to your door.",
  },
  {
    title: "Sliding Umbrella",
    image: umbrella,
    description:
      "Branded patio and market umbrellas with sliding mechanism. Full-colour printed canopy panels — great for cafés, dealerships and outdoor events.",
  },
  {
    title: "Pennants — PVC Digital Rectangle & Triangle",
    image: pennants,
    description:
      "Strings of PVC digital pennants in rectangle or triangle shapes. Bold colours, weather-proof — perfect for dealerships, garages and forecourts.",
  },
  {
    title: "Horse Shoe Banners",
    image: horseshoe,
    description:
      "U-shaped horseshoe banner stands that create a self-contained display zone. Three printed panels — great for trade show booths and product launches.",
  },
];

const WA_NUMBER = "27698384045";

function quoteLink(title: string) {
  const message = `Hi Blank2Branded, I'd like a quote for: ${title}. Please send me pricing and lead time.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function DisplayPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={displayHeroBg}
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
            Display & Signage
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            <span className="text-gradient-dtf">Stand out</span> at every event.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-charcoal/85">
            Gazebos, banner walls, flags, table covers and more — branded display solutions for events, expos, dealerships and storefronts. Request a quote on any product below and we'll come back within 4 business hours.
          </p>
          <div className="mt-8">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Blank2Branded, I'd like a quote on display products.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              <MessageCircle className="h-4 w-4" />
              Quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <article
                key={p.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
              >
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
                  <h2 className="text-xl font-black text-charcoal">{p.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/85">
                    {p.description}
                  </p>
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
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
