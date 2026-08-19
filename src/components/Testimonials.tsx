import { Star } from "lucide-react";

type Testimonial = { name: string; feedback: string; stars: 4 | 5 };

const TESTIMONIALS: Testimonial[] = [
  { name: "Thabo M.", stars: 5, feedback: "Ordered 50 DTF prints for our church event — quality was insane and delivery to Joburg was quick. Will definitely order again." },
  { name: "Lerato N.", stars: 5, feedback: "The combed cotton tees feel premium and the prints came out crisp. My customers love them." },
  { name: "Sipho K.", stars: 4, feedback: "Solid prints and great communication. Took an extra day to ship but worth the wait." },
  { name: "Anika P.", stars: 5, feedback: "Best DTF supplier I've used in SA. Colours are vibrant, washes well, no peeling after 20+ washes." },
  { name: "Johan v.d. Merwe", stars: 5, feedback: "Branded staff hoodies for our workshop — guys won't take them off. Top quality and fair pricing." },
  { name: "Naledi S.", stars: 4, feedback: "Loved the golf shirts for our corporate day. Embroidery was neat. Only wish they had more colour options in XL." },
  { name: "Kabelo D.", stars: 5, feedback: "Gang sheet builder saved me so much money. Easy to use and prints arrived exactly as designed." },
  { name: "Megan T.", stars: 5, feedback: "I run a small clothing brand and these guys are now my go-to for blanks and DTF. Reliable every time." },
  { name: "Rashid I.", stars: 4, feedback: "Great service overall. Prints are sharp and the team is helpful when I had questions about file setup." },
  { name: "Zinhle B.", stars: 5, feedback: "Quick turnaround on a last-minute order for our matric dance shirts. Lifesavers!" },
];

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="mx-3 w-[300px] shrink-0 rounded-2xl border border-border bg-background p-6 shadow-sm md:w-[360px]">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < t.stars ? "fill-lime text-lime" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-charcoal">"{t.feedback}"</p>
      <p className="mt-4 text-sm font-semibold text-charcoal">— {t.name}</p>
    </div>
  );
}

export function Testimonials() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="relative overflow-hidden border-b border-border bg-muted/30 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Customer Love
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-charcoal md:text-4xl">
          What our <span className="text-gradient-dtf">customers</span> say
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Real feedback from brands, businesses and creators we've printed for across South Africa.
        </p>
      </div>

      <div className="group relative mt-12 overflow-hidden">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-muted/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-muted/60 to-transparent" />

        <div className="flex w-max animate-testimonial-scroll group-hover:[animation-play-state:paused]">
          {loop.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
