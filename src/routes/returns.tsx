import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function ReturnsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 md:pt-40">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-charcoal md:text-5xl">
            Return &amp; Refund Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 28 July 2026</p>

          <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-charcoal/85">
            <p>
              We want you to be happy with every order. This policy explains when items can be
              returned, how to report a problem, and what we can and cannot accept back.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">1. 7-day return window</h2>
            <p>
              You have <strong>7 calendar days</strong> from the date you receive your order to
              request a return for items that are <strong>defective out of the box</strong> or that{" "}
              <strong>arrived damaged</strong>. After 7 days we are unfortunately unable to process
              a return or replacement.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">
              2. Damage on delivery must be reported the same day
            </h2>
            <p>
              If your parcel or its contents arrive damaged, you{" "}
              <strong>must notify us on the same day you receive the delivery</strong>. Courier
              damage claims have strict time limits, and we cannot lodge a claim or replace goods if
              the damage is reported later.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Email <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">hello@blank2branded.co.za</a> or WhatsApp +27 69 838 4045.</li>
              <li>Include your order number, a description of the fault, and clear photos of the item, the damage and the outer packaging.</li>
              <li>Keep all original packaging until the claim is resolved.</li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">3. Condition of returned goods</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Items must be unused, unwashed and in their original packaging with labels attached.</li>
              <li>Blank apparel that has been printed, branded, embroidered, heat-pressed or otherwise altered cannot be returned.</li>
              <li>We may inspect returned goods before approving a refund or replacement.</li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">4. Custom, branded &amp; printed items</h2>
            <p>
              DTF transfers, gang sheets, sublimated kits and any branded or personalised products
              are made to your specification and are <strong>not returnable</strong> unless the item
              is defective or we made an error against your approved artwork and specification. We
              print artwork exactly as supplied, so spelling, colour profile and resolution issues in
              your files are not covered.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">5. Incorrect items or shortages</h2>
            <p>
              Please check your order against your invoice on delivery. Report incorrect, missing or
              short-shipped items within 7 days and we will correct the order at our cost.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">6. How the return process works</h2>
            <ol className="list-decimal space-y-2 pl-6">
              <li>Contact us within the applicable time limit with your order number and photos.</li>
              <li>We assess the claim and confirm in writing whether the return is approved.</li>
              <li>If approved, we arrange collection or provide a return address. Do not send goods back before approval.</li>
              <li>Once received and inspected, we issue a replacement, credit or refund.</li>
            </ol>

            <h2 className="text-2xl font-bold text-charcoal">7. Refunds</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Approved refunds are processed within 7–14 working days of the goods being received and inspected.</li>
              <li>Refunds are paid back to the original payment method or bank account used for the order.</li>
              <li>Where a replacement is available and acceptable to you, we will supply a replacement instead of a refund.</li>
            </ul>

            <h2 className="text-2xl font-bold text-charcoal">8. Return shipping costs</h2>
            <p>
              We cover return shipping where the item is defective, damaged in transit or incorrectly
              supplied by us. For any other approved return, the return shipping cost is for your
              account and the original delivery fee is not refundable.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">9. Cancellations</h2>
            <p>
              Orders can be cancelled before production or dispatch begins. Once artwork has been
              approved and production has started, or once the order has been couriered, it can no
              longer be cancelled.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">10. Your rights</h2>
            <p>
              This policy does not limit your rights under the South African Consumer Protection Act
              68 of 2008.
            </p>

            <h2 className="text-2xl font-bold text-charcoal">11. Contact us</h2>
            <p>
              Blank2Branded, Mbombela, Mpumalanga ·{" "}
              <a className="text-primary underline" href="mailto:hello@blank2branded.co.za">
                hello@blank2branded.co.za
              </a>{" "}
              · WhatsApp +27 69 838 4045 · Mon–Fri 8am–4pm.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
