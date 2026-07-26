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

const LOGO = 'https://blank2branded.co.za/logo.png';
const ORANGE = '#FF5A00';
const INK = '#1c1c1c';

function shell(inner: string, preheader: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;color:${INK}">
    <div style="display:none;font-size:1px;color:#f4f4f5;max-height:0;overflow:hidden">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <tr><td style="background:${INK};padding:24px" align="center">
            <img src="${LOGO}" width="150" alt="Blank2Branded" style="display:block;height:auto;border:0;max-width:150px"/>
          </td></tr>
          <tr><td style="height:4px;background:linear-gradient(90deg,#FF5A00,#e0148c,#f5c400,#22a6d8)">&nbsp;</td></tr>
          ${inner}
          <tr><td style="background:#fafafa;border-top:1px solid #eee;padding:20px 28px;text-align:center;color:#888;font-size:12px;line-height:1.6">
            <strong style="color:${INK}">Blank2Branded</strong> — From Blank to Branded<br/>
            Mbombela, South Africa · Mon–Fri 8am–4pm<br/>
            <a href="mailto:hello@blank2branded.co.za" style="color:${ORANGE};text-decoration:none">hello@blank2branded.co.za</a> ·
            <a href="https://wa.me/27698384045" style="color:${ORANGE};text-decoration:none">WhatsApp +27 69 838 4045</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function itemRows(data: z.infer<typeof BodySchema>) {
  return data.items
    .map(
      (i) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px">
          <strong style="color:${INK}">${i.name}</strong>${i.description ? `<br/><span style="color:#777;font-size:12px">${i.description}</span>` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#555">${i.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;white-space:nowrap"><strong>${fmt(i.rate * i.quantity, data.currency)}</strong></td>
      </tr>`,
    )
    .join('');
}

function totalsBlock(data: z.infer<typeof BodySchema>, subtotal: number, total: number) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;font-size:14px">
    <tr><td style="padding:4px 0;color:#666">Subtotal</td><td align="right" style="padding:4px 0">${fmt(subtotal, data.currency)}</td></tr>
    <tr><td style="padding:4px 0;color:#666">Shipping</td><td align="right" style="padding:4px 0">${fmt(data.shipping, data.currency)}</td></tr>
    <tr><td style="padding:12px 0 0;border-top:2px solid ${INK};font-size:17px;font-weight:bold">Total</td>
        <td align="right" style="padding:12px 0 0;border-top:2px solid ${INK};font-size:17px;font-weight:bold;color:${ORANGE}">${fmt(total, data.currency)}</td></tr>
  </table>`;
}

function addressBlock(data: z.infer<typeof BodySchema>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#fafafa;border:1px solid #eee;border-radius:10px">
    <tr><td style="padding:16px 18px;font-size:13px;line-height:1.7;color:#444">
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#999;margin-bottom:6px">Delivery details</div>
      <strong style="color:${INK}">${data.customer.firstName} ${data.customer.lastName}</strong><br/>
      ${data.customer.phone}<br/>
      ${data.customer.email}<br/>
      ${data.customer.address.replace(/\n/g, '<br/>')}
    </td></tr>
  </table>`;
}

function buildCustomerHtml(data: z.infer<typeof BodySchema>, subtotal: number, total: number) {
  const inner = `<tr><td style="padding:32px 28px">
      <h1 style="margin:0 0 6px;font-size:24px;color:${INK}">Thanks, ${data.customer.firstName}! 🎉</h1>
      <p style="margin:0 0 4px;color:#555;font-size:15px;line-height:1.6">
        We've received your order${data.invoiceNumber ? ` <strong>${data.invoiceNumber}</strong>` : ''} and our team is on it.
        Someone will be in touch shortly to confirm details and arrange payment.
      </p>
      <div style="margin:22px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#999">Order summary</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(data)}</table>
      ${totalsBlock(data, subtotal, total)}
      ${addressBlock(data)}
      <p style="margin:26px 0 0;font-size:13px;color:#666;line-height:1.6">
        Please note: any order with artwork or printing has a <strong>7–14 working day</strong> lead time.
      </p>
      <div style="margin-top:26px;text-align:center">
        <a href="https://wa.me/27698384045" style="display:inline-block;background:${ORANGE};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 26px;border-radius:8px">Chat to us on WhatsApp</a>
      </div>
    </td></tr>`;
  return shell(inner, `Order received — thanks ${data.customer.firstName}, we'll be in touch shortly.`);
}

function buildOwnerHtml(data: z.infer<typeof BodySchema>, subtotal: number, total: number) {
  const inner = `<tr><td style="padding:32px 28px">
      <div style="display:inline-block;background:${ORANGE};color:#fff;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px">New order</div>
      <h1 style="margin:12px 0 4px;font-size:23px;color:${INK}">${data.customer.firstName} ${data.customer.lastName} — ${fmt(total, data.currency)}</h1>
      ${data.invoiceNumber ? `<p style="margin:0;color:#777;font-size:13px">Ref ${data.invoiceNumber}</p>` : ''}
      <div style="margin:22px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#999">Items</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(data)}</table>
      ${totalsBlock(data, subtotal, total)}
      ${addressBlock(data)}
      <div style="margin-top:24px;text-align:center">
        <a href="mailto:${data.customer.email}" style="display:inline-block;background:${INK};color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:8px">Reply to customer</a>
      </div>
    </td></tr>`;
  return shell(inner, `New order from ${data.customer.firstName} ${data.customer.lastName} — ${fmt(total, data.currency)}`);
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
