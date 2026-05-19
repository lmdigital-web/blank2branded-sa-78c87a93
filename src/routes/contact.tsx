import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { MessageCircle, Mail, Clock, MapPin, Upload, Send } from "lucide-react";

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

      <section className="border-b border-border py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Contact
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
            Get a Quote or Open a Trade Account.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            We reply to all trade enquiries within 4 business hours.
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 md:w-auto"
                >
                  Send Enquiry <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* DETAILS */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-charcoal p-8 text-background">
              <h2 className="text-xl font-bold">Talk to us directly.</h2>
              <ul className="mt-8 space-y-6">
                <li className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background/5 text-primary">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-background/50">WhatsApp Business</p>
                    <a href="https://wa.me/27000000000" className="mt-1 block text-base font-semibold hover:text-primary">
                      +27 00 000 0000
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background/5 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-background/50">Email</p>
                    <a href="mailto:hello@blank2branded.co.za" className="mt-1 block text-base font-semibold hover:text-primary">
                      hello@blank2branded.co.za
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background/5 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-background/50">Hours</p>
                    <p className="mt-1 text-base font-semibold">Mon–Fri · 8am–5pm</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background/5 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-background/50">Location</p>
                    <p className="mt-1 text-base font-semibold">Mbombela, SA</p>
                    <p className="text-sm text-background/60">Courier nationwide</p>
                  </div>
                </li>
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
