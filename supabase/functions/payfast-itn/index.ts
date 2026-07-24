import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MERCHANT_ID = Deno.env.get('PAYFAST_MERCHANT_ID');
const PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') ?? '';
const MODE = (Deno.env.get('PAYFAST_MODE') ?? 'sandbox').toLowerCase();
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const VALIDATE_HOST =
  MODE === 'live' ? 'https://www.payfast.co.za' : 'https://sandbox.payfast.co.za';

const OWNER = 'hello@blank2branded.co.za';
const FROM = 'Blank2Branded <hello@blank2branded.co.za>';

const pfEncode = (v: string) =>
  encodeURIComponent(v)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function md5(input: string): Promise<string> {
  const md5fn = (await import('npm:blueimp-md5@2.19.0')).default as (s: string) => string;
  return md5fn(input);
}

async function sendEmail(payload: Record<string, unknown>) {
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) return;
  await fetch('https://connector-gateway.lovable.dev/resend/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify(payload),
  }).catch((e) => console.error('email send failed', e));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const data: Record<string, string> = {};
    for (const [k, v] of params.entries()) data[k] = v;

    // 1. Verify signature
    const signature = data.signature;
    delete data.signature;
    let sigBase = Object.entries(data)
      .map(([k, v]) => `${k}=${pfEncode(v.trim())}`)
      .join('&');
    if (PASSPHRASE) sigBase += `&passphrase=${pfEncode(PASSPHRASE.trim())}`;
    const expected = await md5(sigBase);
    if (expected !== signature) {
      console.error('payfast-itn: bad signature', { expected, got: signature });
      return new Response('invalid signature', { status: 400 });
    }

    // 2. Verify merchant
    if (MERCHANT_ID && data.merchant_id !== MERCHANT_ID) {
      console.error('payfast-itn: merchant mismatch', data.merchant_id);
      return new Response('invalid merchant', { status: 400 });
    }

    // 3. Validate with PayFast server
    const validateRes = await fetch(`${VALIDATE_HOST}/eng/query/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: raw,
    });
    const validateText = (await validateRes.text()).trim();
    if (validateText !== 'VALID') {
      console.error('payfast-itn: validate failed', validateText);
      return new Response('validation failed', { status: 400 });
    }

    console.log('payfast-itn OK', {
      m_payment_id: data.m_payment_id,
      pf_payment_id: data.pf_payment_id,
      status: data.payment_status,
      amount: data.amount_gross,
      invoice: data.custom_str1,
    });

    // 4. On COMPLETE, notify owner + customer
    if (data.payment_status === 'COMPLETE') {
      const invoice = data.custom_str1 || '';
      const customerEmail = data.custom_str2 || data.email_address || '';
      const customerName = data.custom_str3 || `${data.name_first ?? ''} ${data.name_last ?? ''}`.trim();
      const amount = data.amount_gross;

      await Promise.all([
        sendEmail({
          from: FROM,
          to: [OWNER],
          subject: `✅ Payment received — ${customerName} — R${amount}${invoice ? ` (${invoice})` : ''}`,
          html: `<h2>Payment received via PayFast</h2>
            <p><strong>${customerName}</strong> (${customerEmail})</p>
            <p>Amount: <strong>R ${amount}</strong><br/>
            PayFast payment ID: ${data.pf_payment_id}<br/>
            Our reference: ${data.m_payment_id}<br/>
            ${invoice ? `Invoice: <strong>${invoice}</strong>` : ''}</p>`,
        }),
        customerEmail
          ? sendEmail({
              from: FROM,
              to: [customerEmail],
              reply_to: OWNER,
              subject: `Payment confirmed${invoice ? ` — ${invoice}` : ''} · Blank2Branded`,
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2>Thanks, ${data.name_first ?? ''}!</h2>
                <p>We've received your PayFast payment of <strong>R ${amount}</strong>${invoice ? ` for invoice <strong>${invoice}</strong>` : ''}.</p>
                <p>Your order is now in production. We'll be in touch on WhatsApp with artwork and dispatch updates.</p>
                <p style="color:#888;font-size:12px;margin-top:32px">Blank2Branded · hello@blank2branded.co.za · +27 69 838 4045</p>
              </div>`,
            })
          : Promise.resolve(),
      ]);
    }

    // PayFast expects a 200 with any body.
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('payfast-itn error', err);
    return new Response('error', { status: 500 });
  }
});
