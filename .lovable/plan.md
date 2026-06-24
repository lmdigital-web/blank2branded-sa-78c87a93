## Goal
Remove Shopify completely. Run your own catalogue from the backend. Replace "Checkout" with **"Request Quote"** — submissions email **hello@blank2branded.co.za**.

## What changes for you

- **You manage products yourself** in `/admin` (new Products section): add/edit/delete, with colours, sizes, prices, images, categories.
- **Customers add to cart** like before, but the cart button becomes **"Request Quote"**. A small form (name, email, phone, message) captures their details.
- **You receive an email** with the cart contents + customer details. You then quote them manually.
- **Customer gets a confirmation email** that their request was received.
- **No more Shopify**, no checkout, no online payments.

## What I'll build

1. **Database** — new tables: `products`, `product_variants` (colour/size/price), `product_images`, `categories`, `quote_requests` (with line items).
2. **Migrate your 21 existing Shopify products** automatically into the new tables so nothing is lost.
3. **Admin → Products** — full CRUD: list, add, edit (with image upload to existing `blog-images` bucket renamed to `product-images`), variants editor, category assignment.
4. **Admin → Quotes** — inbox of all quote requests with status (new / quoted / closed), filterable.
5. **Shop / product pages** — same look and feel, but pulling from your DB instead of Shopify. Categories sidebar stays.
6. **Cart** — local-only (no more Shopify cart sync). Stripped down.
7. **Quote request flow** — replaces the Checkout button. Opens a sheet with customer details form → submits to backend → emails sent.
8. **Email setup** — Lovable Emails with `notify.blank2branded.co.za`. Two templates: customer confirmation + internal notification to hello@.
9. **Cleanup** — delete `src/lib/shopify.ts`, Shopify cart mutations, DTF upsell (still works locally), update sitemap generator to read from DB.
10. **Disconnect Shopify** at the end once you confirm the new shop looks right.

## Technical notes

- Product variants table will support up to 3 option dimensions (e.g. Colour + Size + Material).
- Quote requests stored permanently — you can review history any time.
- Email subject example: `New quote request — 5 items — John Smith`.
- Sitemap will be regenerated from the DB so SEO continues working.

## Required from you now

Set up the email domain by clicking the button below. I'll use `notify.blank2branded.co.za` (separate from your main domain — won't conflict with anything). DNS verification happens in the background; the rest of the build doesn't wait for it.

<presentation-actions>
<presentation-open-email-setup>Set up email domain</presentation-open-email-setup>
</presentation-actions>

After you click that, reply "go" and I'll start building.