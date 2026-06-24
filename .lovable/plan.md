# Custom Ecommerce Build Plan

Replace the quote-request flow with a full ecommerce checkout backed by PayFast, plus a customer portal and admin order management. All data lives in Lovable Cloud.

## Confirmed decisions

- **Gateway:** PayFast (cards, Instant EFT, Snapscan, etc.)
- **Quote flow:** Removed entirely; replaced with Checkout
- **MOQ:** Hard-block — every order must contain **3+ Apparel items** (DTF Prints / Print Services / Other are exempt and don't count toward the 3)
- **Guest checkout:** Disabled — customers must sign up / sign in
- **Shipping:** Flat **R120** nationwide
- **VAT:** None — prices are inclusive, no VAT line on invoices

## Database (new tables)

```text
customer_addresses   - saved shipping/billing addresses per user
orders               - one row per order (status, totals, payment ref, shipping addr snapshot)
order_items          - line items snapshot (product_id, variant_id, sku, name, price, qty)
order_events         - status history / audit trail (paid, shipped, etc.)
```

Statuses: `pending_payment` → `paid` → `in_production` → `shipped` → `delivered` (plus `cancelled`, `refunded`).
RLS: customers see their own orders/addresses; admins see all. Service role used by edge functions.

## Customer-facing pages

- **Cart drawer** — keep current UI, swap "Request Quote" button for "Checkout". Show MOQ blocker if <3 apparel items.
- **`/checkout`** (auth required) — shipping address form (saved addresses + new), order summary, R120 shipping line, total, "Pay with PayFast" button.
- **`/checkout/success`** — landed here after PayFast redirect; polls order status, shows confirmation.
- **`/checkout/cancelled`** — payment cancelled, return to cart.
- **`/account`** — customer portal landing (orders list, addresses, profile).
- **`/account/orders/:id`** — order detail with status timeline + tracking number.

## Admin

- **`/admin/orders`** — list + filters by status, search by order number/email.
- **`/admin/orders/:id`** — line items, customer info, address, status updates, tracking number entry, internal notes.
- Sidebar adds an **Orders** entry (with "new" badge).
- Existing **Quotes** page kept read-only for historical records, eventually removable.

## Edge functions

1. **`create-payfast-checkout`** — validates cart server-side against `shop_product_variants`, recomputes totals (never trusts client prices), enforces MOQ, creates `orders` + `order_items` rows in `pending_payment`, builds a signed PayFast redirect URL, returns it.
2. **`payfast-itn`** — PayFast webhook (Instant Transaction Notification). Verifies signature + source IP + posts back to PayFast for validation, marks order `paid`, writes `order_events` row, sends confirmation email via Resend.
3. **`update-order-status`** — admin-only: status changes, tracking number, triggers customer email (shipped, etc.).

## PayFast integration

- Sandbox first (`https://sandbox.payfast.co.za/eng/process`) → switch to live (`https://www.payfast.co.za/eng/process`) once you've tested.
- Secrets needed (I'll request them in a follow-up message): `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_MODE` (`sandbox`/`live`).
- Order number format: `B2B-{yyyymmdd}-{seq}` used as `m_payment_id` for reconciliation.

## Emails (Resend, already wired)

- Order confirmation (after successful ITN)
- Shipped notification (with tracking number)
- All sent from `hello@blank2branded.co.za`

## Implementation order

1. Migration: orders / order_items / order_events / customer_addresses + RLS + grants
2. Edge function: `create-payfast-checkout`
3. Edge function: `payfast-itn` (webhook)
4. Checkout page + success/cancel pages
5. Cart drawer update (Checkout button, MOQ block)
6. Customer portal (`/account`, `/account/orders/:id`)
7. Admin orders pages + sidebar
8. Email templates for confirmation + shipped
9. Remove Request Quote dialog from product pages

## After approval

I'll need from you (in a follow-up — don't paste yet):
- PayFast **Merchant ID**
- PayFast **Merchant Key**
- PayFast **Passphrase** (set one in PayFast Settings → Integration if you haven't)
- Confirmation to start in **sandbox** mode

Build will be done in stages with the preview working after each stage so you can test.
