import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 md:pt-40">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 24 June 2026</p>

          <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-charcoal/85">
            <p>
              Blank2Branded ("we", "us", "our") respects your privacy and is committed to protecting
              your personal information in line with the Protection of Personal Information Act, 2013
              (POPIA) of South Africa. This policy explains what we collect, how we use it, and your
              rights as a data subject.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">1. Who we are</h2>
            <p>
              Blank2Branded is a South African supplier of DTF transfers and blank apparel based in
              Mbombela, Mpumalanga. You can contact us at{" "}
              <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">
                hello@blank2branded.co.za
              </a>{" "}
              or on WhatsApp at +27 69 838 4045.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">2. Information we collect</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Order &amp; contact details:</strong> name, email, phone number, delivery
                address and order history when you place an order or request a quote.
              </li>
              <li>
                <strong>Artwork &amp; files:</strong> any print files (DTF gang sheets, logos,
                designs) you upload for production.
              </li>
              <li>
                <strong>Payment details:</strong> processed by our payment provider — we do not
                store full card numbers on our servers.
              </li>
              <li>
                <strong>Site usage:</strong> anonymous analytics such as pages viewed, device type
                and referring source to improve the website.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">3. How we use your information</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>To process and deliver your orders and provide customer support.</li>
              <li>To send order updates, quotes and transactional emails.</li>
              <li>To respond to enquiries received via the contact form, email or WhatsApp.</li>
              <li>To improve our products, website and service quality.</li>
              <li>
                To send marketing communications — only where you have opted in. You can unsubscribe
                at any time.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">4. Sharing your information</h2>
            <p>
              We do not sell your personal information. We share it only with trusted service
              providers that help us run our business, including our e-commerce platform (Shopify),
              payment gateways, courier services for delivery, and email/analytics tools. These
              providers are bound by their own privacy and security obligations.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">5. Cookies</h2>
            <p>
              Our website uses cookies and similar technologies for essential site functionality
              (such as the shopping cart) and basic analytics. You can disable cookies in your
              browser, but some parts of the site may not work correctly.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">6. Data retention</h2>
            <p>
              We keep your information only for as long as needed to fulfil orders, comply with tax
              and legal obligations, and resolve disputes. Print files are stored for the time
              needed to complete and re-run your order if required.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">7. Your rights under POPIA</h2>
            <p>You have the right to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Request access to the personal information we hold about you.</li>
              <li>Request correction or deletion of your information.</li>
              <li>Object to direct marketing.</li>
              <li>
                Lodge a complaint with the Information Regulator of South Africa
                (inforeg@justice.gov.za).
              </li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">
                hello@blank2branded.co.za
              </a>
              .
            </p>

            <h2 className="text-2xl font-bold text-charcoal">8. Security</h2>
            <p>
              We use reasonable technical and organisational measures to protect your information.
              No method of transmission over the internet is 100% secure, but we work with reputable
              providers and review our practices regularly.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. The latest version will always be
              available on this page with the updated date at the top.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
