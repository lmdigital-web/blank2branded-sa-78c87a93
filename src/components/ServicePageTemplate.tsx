// Reusable service page template.
//
// One component renders every /services/:slug/ page from a ServicePage row:
// H1, intro, benefits, the 4-step process, FAQ, a Request-a-Quote form plus
// WhatsApp CTA above the fold and again at the bottom, related services and
// blog links.
//
// The same structure is emitted at build time by renderServiceBody() in
// scripts/prerender-routes.ts — keep the two in sync so crawlers and React
// render the same page.

import DOMPurify from "isomorphic-dompurify";
import {
  Check,
  MessageCircle,
  ArrowRight,
  ClipboardCheck,
  Printer,
  Truck,
  HelpCircle,
  Sparkles,
  Package,
  Phone,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuoteForm } from "@/components/QuoteForm";
import { Link } from "@/lib/static-router";
import { whatsappHref } from "@/lib/whatsapp";
import {
  serviceBenefits,
  serviceBlogLinks,
  serviceFaqs,
  serviceProcessSteps,
  resolveBlogHref,
  resolveRelatedHref,
  serviceRelated,
  type ServicePage,
} from "@/lib/service-pages";

const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "referrerpolicy",
      "target",
      "rel",
    ],
  });

const PROCESS_ICONS = [ClipboardCheck, Printer, Truck];

function WhatsAppCta({ service }: { service: string }) {
  return (
    <a
      href={whatsappHref(`Hi Blank2Branded, I'd like a quote for ${service}.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.02]"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp us
    </a>
  );
}

export function ServicePageTemplate({ page }: { page: ServicePage }) {
  const service = page.title;
  const h1 = page.h1 || page.title;
  // Short human label for headings — the SEO title is far too long to read inline.
  const label = page.short_title || service;
  const benefits = serviceBenefits(page);
  const steps = serviceProcessSteps(page);
  const faqs = serviceFaqs(page);
  const related = serviceRelated(page);
  const blogLinks = serviceBlogLinks(page);
  

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* ---- HERO: H1, intro, and the above-the-fold quote form + WhatsApp ---- */}
      <section className="relative overflow-hidden border-b border-border pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-cyan blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-magenta blur-3xl" />
          <div className="absolute right-1/3 bottom-0 h-72 w-72 rounded-full bg-primary blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Our Services
            </p>
            {/* The single H1 for this page — the prerenderer emits this same node. */}
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
              {h1}
            </h1>
            {page.intro && (
              <p className="mt-6 max-w-2xl text-lg text-charcoal/85">{page.intro}</p>
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#quote"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-dtf px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                Request a Quote <ArrowRight className="h-4 w-4" />
              </a>
              <WhatsAppCta service={label} />
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-charcoal/75">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> +27 69 838 4045
              </span>
              <span className="inline-flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Courier nationwide
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Quotes in 4 business
                hours
              </span>
            </p>
          </div>

          {/* Above-the-fold quote form. The bottom of the page repeats it. */}
          <div id="quote" className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-charcoal">Request a Quote</h2>
              <p className="mt-2 text-sm text-charcoal/75">
                Tell us what you need and we'll come back with pricing within 4 business hours.
              </p>
              <div className="mt-6">
                <QuoteForm service={label} variant="compact" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {page.body_html && (
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div
              className="prose prose-neutral max-w-none text-charcoal"
              dangerouslySetInnerHTML={{ __html: sanitize(page.body_html) }}
            />
          </div>
        </section>
      )}

      {/* ---- BENEFITS ---- */}
      {benefits.length > 0 && (
        <section className="border-y border-border bg-surface py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-black tracking-tight text-charcoal md:text-4xl">
              Why choose {label}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-border bg-background p-6"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-charcoal">{b.title}</h3>
                  <p className="mt-2 text-charcoal/80">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- PROCESS: enquire → design proof → production → delivery ---- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-black tracking-tight text-charcoal md:text-4xl">
            How it works
          </h2>
          <p className="mt-4 max-w-2xl text-charcoal/80">
            Four steps from enquiry to delivery. You approve a design proof before
            anything goes into production.
          </p>

          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = PROCESS_ICONS[i % PROCESS_ICONS.length];
              return (
                <li
                  key={`${s.step}-${s.title}`}
                  className="relative rounded-xl border border-border bg-background p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-dtf text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-4xl font-black text-charcoal/10">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-charcoal">{s.title}</h3>
                  <p className="mt-2 text-sm text-charcoal/80">{s.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---- FAQ (mirrors the FAQPage JSON-LD) ---- */}
      {faqs.length > 0 && (
        <section className="border-y border-border bg-surface py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="flex items-center gap-3 text-3xl font-black tracking-tight text-charcoal md:text-4xl">
              <HelpCircle className="h-8 w-8 text-primary" />
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-4">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-lg border border-border bg-background p-5"
                >
                  <summary className="cursor-pointer text-lg font-bold text-charcoal marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-charcoal/80">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- BOTTOM CTA: quote form + WhatsApp, repeated ---- */}
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="text-3xl font-black tracking-tight text-charcoal md:text-4xl">
              Ready to start your {label.toLowerCase()} order?
            </h2>
            <p className="mt-4 text-charcoal/80">
              Send your artwork or brief, and we'll come back with a quote within
              4 business hours. Prefer to chat? WhatsApp us and we'll sort it out
              there and then.
            </p>
            <div className="mt-8">
              <WhatsAppCta service={label} />
            </div>
            <p className="mt-4 text-sm text-charcoal/75">
              or call <a className="font-semibold underline" href="tel:+27698384045">+27 69 838 4045</a>{" "}
              · Mon–Fri 8am–4pm · Mbombela, Mpumalanga
            </p>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-8">
              <h3 className="text-xl font-bold text-charcoal">Request a Quote</h3>
              <div className="mt-6">
                <QuoteForm service={label} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- RELATED SERVICES ---- */}
      {related.length > 0 && (
        <section className="border-t border-border bg-surface py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-black tracking-tight text-charcoal md:text-4xl">
              Related services
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={resolveRelatedHref(r.slug)}
                  className="group rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary"
                >
                  <h3 className="flex items-center gap-2 text-lg font-bold text-charcoal">
                    {r.title}
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                  </h3>
                  {r.description && (
                    <p className="mt-2 text-charcoal/80">{r.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- BLOG LINKS ---- */}
      {blogLinks.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-black tracking-tight text-charcoal md:text-4xl">
              {label} guides &amp; tips
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogLinks.map((b) => (
                <Link
                  key={b.slug}
                  to={resolveBlogHref(b.slug)}
                  className="group rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary"
                >
                  <h3 className="flex items-start gap-2 text-base font-bold text-charcoal">
                    {b.title}
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                  </h3>
                </Link>
              ))}
            </div>
            <Link
              to="/blog/"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Read all articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}