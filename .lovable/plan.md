# Proforma-first checkout flow

Right now every checkout creates a live Zoho invoice, even when the customer never pays. We'll switch to an **estimate (proforma)** at checkout, and only create a real **invoice — already marked paid** in Zoho once PayFast confirms the payment.

## New flow

```text
Checkout → create Zoho Estimate (proforma)
        → email proforma PDF + PayFast pay link to customer
        → redirect customer to PayFast
                │
                ├─ payment success (PayFast ITN)
                │     → convert estimate to Invoice in Zoho
                │     → record payment → invoice marked Paid
                │     → email paid invoice to customer + owner
                │     → show "Thank you / Payment received" page
                │
                └─ payment cancelled / failed
                      → estimate stays open in Zoho (can follow up manually)
                      → show "Payment not completed" page with retry link
```

## What changes

### Edge functions
- **Rename/replace `zoho-create-invoice` → `zoho-create-estimate`**
  Creates/updates the Zoho contact, creates an **Estimate** (not Invoice), returns `estimate_id`, `estimate_number`, and public `estimate_url`. Emails the estimate to the customer via Zoho.
- **`payfast-create-payment`** — unchanged inputs, but `m_payment_id` = `estimate_id` and `custom_str1` = `estimate_number` so the ITN can find the estimate.
- **`payfast-itn`** — on `payment_status = COMPLETE`:
  1. `POST /estimates/{id}/convert?organization_id=…` → returns the new `invoice_id`
  2. `POST /customerpayments` with `invoice_id`, `amount`, `payment_mode: "PayFast"`, `reference_number = pf_payment_id` → invoice becomes Paid
  3. `POST /invoices/{id}/email` → sends the paid invoice PDF
  4. Call `send-order-notification` for the branded confirmation to customer + owner
- **`send-order-notification`** — add a `stage` param (`"proforma"` | `"paid"`) so the email copy matches the moment (either "Here's your proforma, complete payment" or "Payment received — invoice attached").

### Frontend (`src/routes/checkout.tsx`)
- "Pay now" flow becomes: create estimate → send proforma email → redirect to PayFast (same UX, just a proforma is generated instead of an invoice).
- Add two thin result pages (or in-page states):
  - `/checkout/success/` — reads `?estimate=…`, shows "Payment received, invoice on the way".
  - `/checkout/cancelled/` — shows "Payment not completed", link back to cart.
- Update PayFast `return_url` / `cancel_url` to these pages.

### Cart / Drawer
- No visible change. Cart still hands off to `/checkout/`.

## What doesn't change
- Product data, branding pricing, MOQ, VAT/markup logic.
- PayFast credentials/signature logic (only the reference IDs change).
- Resend + branded emails (just an extra template variant).

## Technical notes
- Zoho Books endpoints used: `POST /estimates`, `POST /estimates/{id}/email`, `POST /estimates/{id}/convert`, `POST /customerpayments`, `POST /invoices/{id}/email` — all through the existing `zoho_books` connector gateway, no new secrets.
- ITN handler must be idempotent: check if the estimate already has a linked invoice before converting (Zoho returns the existing invoice_id on repeat converts, but we'll guard anyway) and skip payment recording if `reference_number` already exists on the invoice.
- Failed conversions are logged and surfaced to owner email so nothing silently drops.

Shall I build this?
