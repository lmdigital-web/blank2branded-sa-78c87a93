import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 md:pt-40">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-magenta">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 24 June 2026</p>

          <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-charcoal/80">
            <p>
              These terms govern your use of the Blank2Branded website and the purchase of DTF
              transfers, blank apparel and related services from us. By placing an order or using
              the site you agree to these terms.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">1. About us</h2>
            <p>
              Blank2Branded is a South African supplier of DTF transfers and blank apparel based in
              Mbombela, Mpumalanga. Contact:{" "}
              <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">
                hello@blank2branded.co.za
              </a>{" "}
              · WhatsApp +27 69 838 4045.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">2. Orders</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                An order is only confirmed once payment has been received and approved. We reserve
                the right to refuse or cancel any order.
              </li>
              <li>
                Stock availability is not guaranteed until payment is confirmed. If an item becomes
                unavailable, we will contact you to arrange a refund or alternative.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">3. Pricing &amp; payment</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>All prices are in South African Rand (ZAR) and include VAT where applicable.</li>
              <li>
                Prices, promotions and product availability may change without notice. We will
                honour the price valid at the time your order is placed and paid.
              </li>
              <li>Payment is processed securely via our payment provider at checkout.</li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">4. DTF prints &amp; artwork</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                You are responsible for the quality, colour profile and content of any artwork or
                gang sheets you supply. We print as supplied and cannot be held responsible for
                low-resolution files, incorrect colours or spelling errors.
              </li>
              <li>
                A once-off setup fee may apply to custom prints. This will be clearly indicated at
                checkout.
              </li>
              <li>
                You warrant that you own or have the right to use all artwork and trademarks you
                submit and indemnify us against any third-party claims.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">5. Production &amp; delivery</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Standard production time is 2–5 working days after payment and artwork approval.
                Larger or custom orders may take longer.
              </li>
              <li>
                Delivery is via third-party courier across South Africa. Delivery times are
                estimates and outside of our direct control.
              </li>
              <li>
                Risk in the goods passes to you on delivery to the address you supplied. Please
                ensure your delivery details are correct.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">6. Returns &amp; refunds</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Inspect your order on delivery. Report any damaged, defective or incorrect items
                within 48 hours to{" "}
                <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">
                  hello@blank2branded.co.za
                </a>{" "}
                with photos.
              </li>
              <li>
                Custom DTF prints and gang sheets produced from your artwork are non-refundable
                unless the product is defective or incorrectly printed due to our error.
              </li>
              <li>
                Blank apparel may be returned unworn, unwashed and in original condition within 7
                days of delivery. Return courier costs are for the customer's account unless the
                product is faulty.
              </li>
              <li>
                Approved refunds are processed via the original payment method within 7–14 working
                days.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">7. Intellectual property</h2>
            <p>
              All website content, branding, logos and product photography belong to Blank2Branded
              and may not be copied or reused without written permission. You retain rights to your
              own artwork submitted for printing.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by South African law, Blank2Branded is not liable for
              any indirect or consequential loss arising from the use of our products or website.
              Our total liability for any claim is limited to the value of the order in question.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">9. Governing law</h2>
            <p>
              These terms are governed by the laws of the Republic of South Africa. Any disputes
              will be subject to the jurisdiction of the South African courts.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">10. Contact</h2>
            <p>
              Questions about these terms? Email{" "}
              <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">
                hello@blank2branded.co.za
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
