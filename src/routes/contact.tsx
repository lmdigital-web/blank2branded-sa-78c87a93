import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { MessageCircle, Mail, Clock, MapPin, Upload, Send } from "lucide-react";
import contactHeroBg from "@/assets/contact-hero-bg.jpg";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>) => ({
    subject: typeof search.subject === "string" ? search.subject : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contact — Get a Quote | Blank2Branded" },
      {
        name: "description",
        content:
          "Request a quote for DTF prints and blank apparel. Open to brands, businesses and individuals — minimum 5 pieces. We reply within 4 business hours.",
      },
      { property: "og:title", content: "Contact Blank2Branded" },
      { property: "og:description", content: "Get a quote on DTF prints and blanks. Min 5 pieces. Reply within 4 business hours." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { subject } = Route.useSearch();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire up email backend
    setSubmitted(true);
  };

  const inputCls =
    "w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-charcoal placeholder-muted-foreground transition-colors focus:border-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-charcoal";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={contactHeroBg}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover blur-[2px]"
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-cyan blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-magenta blur-3xl" />
          <div className="absolute right-1/3 bottom-0 h-72 w-72 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan">
            Contact
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            Get a <span className="text-gradient-dtf">Quote.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Open to brands, businesses and individuals — minimum 5 pieces per order. We reply to all enquiries within 4 business hours.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-5">
          {/* FORM */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="rounded-lg border-2 border-primary bg-surface p-10 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Send className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-charcoal">
                  Thanks — we've got it.
                </h2>
                <p className="mt-3 text-muted-foreground">
                  We'll reply within 4 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelCls} htmlFor="name">Name</label>
                    <input id="name" name="name" required className={inputCls} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls} htmlFor="business">Business Name</label>
                    <input id="business" name="business" required className={inputCls} placeholder="Brand or company" />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelCls} htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" required className={inputCls} placeholder="you@brand.co.za" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls} htmlFor="phone">Phone</label>
                    <input id="phone" name="phone" type="tel" required className={inputCls} placeholder="+27 ..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelCls} htmlFor="orderType">Order Type</label>
                  <select id="orderType" name="orderType" required className={inputCls}>
                    <option value="">Select an option…</option>
                    <option>DTF Only</option>
                    <option>Blanks Only</option>
                    <option>Full Service (Print + Press)</option>
                  </select>
                </div>

                {subject && (
                  <div className="space-y-2">
                    <label className={labelCls} htmlFor="subject">Subject</label>
                    <input
                      id="subject"
                      name="subject"
                      defaultValue={subject}
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={labelCls} htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className={inputCls}
                    defaultValue={subject ? `Re: ${subject}\n\n` : ""}
                    placeholder="Tell us about your order — quantity, sizes, deadline."
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelCls}>Artwork (optional)</label>
                  <label
                    htmlFor="artwork"
                    className="flex cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-dashed border-border bg-surface px-6 py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-charcoal"
                  >
                    <Upload className="h-5 w-5" />
                    Upload artwork (PNG, AI, PDF)
                    <input id="artwork" name="artwork" type="file" className="hidden" />
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-dtf px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] md:w-auto"
                >
                  Send Enquiry <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* DETAILS */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl bg-charcoal p-8 text-background">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-dtf" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-magenta opacity-20 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan opacity-20 blur-3xl" />
              <h2 className="relative text-xl font-bold">Talk to us directly.</h2>
              <ul className="relative mt-8 space-y-6">
                {[
                  { icon: MessageCircle, color: "lime", label: "WhatsApp Business", value: "+27 00 000 0000", href: "https://wa.me/27000000000" },
                  { icon: Mail, color: "cyan", label: "Email", value: "hello@blank2branded.co.za", href: "mailto:hello@blank2branded.co.za" },
                  { icon: Clock, color: "magenta", label: "Hours", value: "Mon–Fri · 8am–5pm" },
                  { icon: MapPin, color: "primary", label: "Location", value: "Mbombela, SA", sub: "Courier nationwide" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <div
                      className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: `var(--${item.color})` }}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-background/50">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="mt-1 block text-base font-semibold hover:text-primary">
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-base font-semibold">{item.value}</p>
                      )}
                      {item.sub && <p className="text-sm text-background/60">{item.sub}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <iframe
                title="Mbombela map"
                src="https://www.google.com/maps?q=Mbombela,+South+Africa&output=embed"
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
