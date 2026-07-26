import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const FROM = 'Blank2Branded <hello@blank2branded.co.za>';
const OWNER = 'hello@blank2branded.co.za';

const ItemSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(''),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
});

const BodySchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(5),
    email: z.string().email(),
    address: z.string().min(5),
  }),
  items: z.array(ItemSchema).min(1),
  shipping: z.number().nonnegative().default(150),
  currency: z.string().default('ZAR'),
  invoiceNumber: z.string().optional(),
});

const fmt = (n: number, c: string) => `${c} ${n.toFixed(2)}`;

function buildCustomerHtml(data: z.infer<typeof BodySchema>, subtotal: number, total: number) {
  const rows = data.items
    .map(
      (i) => `<tr>
        <td style="padding:10px;border-bottom:1px solid #eee">
          <strong>${i.name}</strong>${i.description ? `<br/><span style="color:#666;font-size:13px">${i.description}</span>` : ''}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${fmt(i.rate * i.quantity, data.currency)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f6f6;margin:0;padding:24px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#111;color:#fff;padding:20px 24px">
        <h1 style="margin:0;font-size:22px">Order received — thank you, ${data.customer.firstName}!</h1>
      </div>
      <div style="padding:24px">
        <p>Hi ${data.customer.firstName},</p>
        <p>We've received your order${data.invoiceNumber ? ` (invoice <strong>${data.invoiceNumber}</strong>)` : ''}. A separate email with your invoice and payment link is on the way from our billing system.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f0f0f0"><th align="left" style="padding:10px">Item</th><th style="padding:10px">Qty</th><th align="right" style="padding:10px">Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <table style="width:100%;margin-top:8px">
          <tr><td>Subtotal</td><td align="right">${fmt(subtotal, data.currency)}</td></tr>
          <tr><td>Shipping</td><td align="right">${fmt(data.shipping, data.currency)}</td></tr>
          <tr><td style="padding-top:8px;font-size:18px;font-weight:bold">Total</td><td align="right" style="padding-top:8px;font-size:18px;font-weight:bold">${fmt(total, data.currency)}</td></tr>
        </table>
        <h3 style="margin-top:24px">Delivery details</h3>
        <p style="color:#444;line-height:1.5">
          ${data.customer.firstName} ${data.customer.lastName}<br/>
          ${data.customer.phone}<br/>
          ${data.customer.email}<br/>
          ${data.customer.address.replace(/\n/g, '<br/>')}
        </p>
        <p style="margin-top:24px">Any questions? Reply to this email or WhatsApp us on +27 69 838 4045.</p>
        <p style="color:#888;font-size:12px;margin-top:32px">Blank2Branded · hello@blank2branded.co.za</p>
      </div>
    </div>
  </body></html>`;
}

function buildOwnerHtml(data: z.infer<typeof BodySchema>, subtotal: number, total: number) {
  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px;border-bottom:1px solid #eee">${i.name}${i.description ? ` — ${i.description}` : ''}</td><td style="padding:6px;text-align:center">${i.quantity}</td><td style="padding:6px;text-align:right">${fmt(i.rate * i.quantity, data.currency)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><body style="font-family:Arial,sans-serif">
    <h2>🛒 New order${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ''}</h2>
    <p><strong>${data.customer.firstName} ${data.customer.lastName}</strong><br/>
      📞 ${data.customer.phone}<br/>
      ✉️ ${data.customer.email}<br/>
      📍 ${data.customer.address.replace(/\n/g, '<br/>')}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <thead><tr style="background:#f0f0f0"><th align="left" style="padding:6px">Item</th><th style="padding:6px">Qty</th><th align="right" style="padding:6px">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p>Subtotal: ${fmt(subtotal, data.currency)}<br/>Shipping: ${fmt(data.shipping, data.currency)}<br/><strong>Total: ${fmt(total, data.currency)}</strong></p>
  </body></html>`;
}

async function sendEmail(payload: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${text}`);
  return text;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error('Email service not configured');
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = parsed.data;
    const subtotal = data.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const total = subtotal + data.shipping;

    const [customerRes, ownerRes] = await Promise.allSettled([
      sendEmail({
        from: FROM,
        to: [data.customer.email],
        reply_to: OWNER,
        subject: `Order confirmation${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ''} · Blank2Branded`,
        html: buildCustomerHtml(data, subtotal, total),
      }),
      sendEmail({
        from: FROM,
        to: [OWNER],
        reply_to: data.customer.email,
        subject: `🛒 New order from ${data.customer.firstName} ${data.customer.lastName} — ${fmt(total, data.currency)}`,
        html: buildOwnerHtml(data, subtotal, total),
      }),
    ]);

    return new Response(
      JSON.stringify({
        customer: customerRes.status,
        owner: ownerRes.status,
        errors: [customerRes, ownerRes]
          .filter((r) => r.status === 'rejected')
          .map((r) => (r as PromiseRejectedResult).reason?.message),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-order-notification error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
