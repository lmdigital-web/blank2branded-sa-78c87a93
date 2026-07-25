import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MERCHANT_ID = Deno.env.get('PAYFAST_MERCHANT_ID');
const PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') ?? '';
const USE_PASSPHRASE = (Deno.env.get('PAYFAST_USE_PASSPHRASE') ?? 'false').toLowerCase() === 'true';
const MODE = (Deno.env.get('PAYFAST_MODE') ?? 'sandbox').toLowerCase();
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ZOHO_KEY = Deno.env.get('ZOHO_BOOKS_API_KEY');

const VALIDATE_HOST =
  MODE === 'live' ? 'https://www.payfast.co.za' : 'https://sandbox.payfast.co.za';
const ZOHO_GATEWAY = 'https://connector-gateway.lovable.dev/zoho_books';

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

async function zoho(path: string, init?: RequestInit) {
  if (!LOVABLE_API_KEY || !ZOHO_KEY) throw new Error('Zoho Books connector not configured');
  const res = await fetch(`${ZOHO_GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': ZOHO_KEY,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  if (!res.ok) throw new Error(`Zoho ${path} [${res.status}]: ${text}`);
  return json as any;
}

async function getOrgId(): Promise<string> {
  const data = await zoho('/organizations');
  return String(data?.organizations?.[0]?.organization_id ?? '');
}

/**
 * Convert an estimate to a paid invoice in Zoho:
 * 1. Convert estimate → invoice
 * 2. Record a customer payment against it (marks it Paid)
 * 3. Email the invoice PDF to the customer
 * Idempotent-ish: if the estimate is already converted, Zoho returns the existing invoice.
 */
async function convertAndPay(opts: {
  estimateId: string;
  amount: number;
  pfPaymentId: string;
  customerEmail: string;
}) {
  const orgId = await getOrgId();
  if (!orgId) throw new Error('No Zoho organization found');

  // 1. Convert estimate → invoice
  let invoiceId: string | undefined;
  let invoiceNumber: string | undefined;
  let contactId: string | undefined;
  try {
    const conv = await zoho(
      `/estimates/${opts.estimateId}/convert?organization_id=${orgId}`,
      { method: 'POST' },
    );
    invoiceId = conv?.invoice?.invoice_id ?? conv?.estimate?.invoice_id;
    invoiceNumber = conv?.invoice?.invoice_number;
    contactId = conv?.invoice?.customer_id ?? conv?.estimate?.customer_id;
  } catch (e) {
    // If already converted, fetch the estimate and read the linked invoice_id
    console.warn('estimate convert warning:', (e as Error).message);
    const est = await zoho(`/estimates/${opts.estimateId}?organization_id=${orgId}`);
    invoiceId = est?.estimate?.invoice_id;
    contactId = est?.estimate?.customer_id;
  }

  if (!invoiceId) throw new Error('No invoice_id after conversion');

  // Fetch invoice details for number + contact
  const inv = await zoho(`/invoices/${invoiceId}?organization_id=${orgId}`);
  invoiceNumber = invoiceNumber ?? inv?.invoice?.invoice_number;
  contactId = contactId ?? inv?.invoice?.customer_id;

  // 2. Record payment (skip if PayFast reference already recorded)
  try {
    const existing = await zoho(
      `/customerpayments?organization_id=${orgId}&reference_number=${encodeURIComponent(opts.pfPaymentId)}`,
    );
    const already = (existing?.customerpayments ?? []).length > 0;
    if (!already && contactId) {
      await zoho(`/customerpayments?organization_id=${orgId}`, {
        method: 'POST',
        body: JSON.stringify({
          customer_id: contactId,
          payment_mode: 'PayFast',
          amount: opts.amount,
          date: new Date().toISOString().slice(0, 10),
          reference_number: opts.pfPaymentId,
          description: `PayFast payment ${opts.pfPaymentId}`,
          invoices: [{ invoice_id: invoiceId, amount_applied: opts.amount }],
        }),
      });
    }
  } catch (e) {
    console.error('record payment failed:', (e as Error).message);
  }

  // 3. Email invoice to customer
  try {
    await zoho(`/invoices/${invoiceId}/email?organization_id=${orgId}`, {
      method: 'POST',
      body: JSON.stringify({
        to_mail_ids: [opts.customerEmail],
        subject: `Tax invoice ${invoiceNumber ?? ''} — payment received · Blank2Branded`,
        body:
          "Hi,\n\nThank you — your payment has been received. Please find your tax invoice attached.\n\nBlank2Branded",
      }),
    });
  } catch (e) {
    console.warn('invoice email step failed:', (e as Error).message);
  }

  return { invoiceId, invoiceNumber };
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
    if (USE_PASSPHRASE && PASSPHRASE.trim()) sigBase += `&passphrase=${pfEncode(PASSPHRASE.trim())}`;
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

    const estimateId = data.custom_str4 || '';
    const estimateNumber = data.custom_str5 || data.custom_str1 || '';
    const customerEmail = data.custom_str2 || data.email_address || '';
    const customerName = data.custom_str3 || `${data.name_first ?? ''} ${data.name_last ?? ''}`.trim();
    const amountGross = parseFloat(data.amount_gross ?? '0');

    console.log('payfast-itn OK', {
      m_payment_id: data.m_payment_id,
      pf_payment_id: data.pf_payment_id,
      status: data.payment_status,
      amount: data.amount_gross,
      estimate: estimateNumber,
      estimateId,
    });

    if (data.payment_status === 'COMPLETE') {
      let convertResult: { invoiceId?: string; invoiceNumber?: string } = {};
      if (estimateId) {
        try {
          convertResult = await convertAndPay({
            estimateId,
            amount: amountGross,
            pfPaymentId: data.pf_payment_id ?? data.m_payment_id ?? '',
            customerEmail,
          });
        } catch (e) {
          console.error('convert-to-invoice failed:', (e as Error).message);
          await sendEmail({
            from: FROM,
            to: [OWNER],
            subject: `⚠️ PayFast paid but Zoho invoice conversion failed — ${customerName}`,
            html: `<p>Payment received but automatic invoice conversion failed.</p>
              <p>Estimate: <strong>${estimateNumber}</strong><br/>
              PayFast ID: ${data.pf_payment_id}<br/>
              Amount: R ${amountGross.toFixed(2)}<br/>
              Customer: ${customerName} (${customerEmail})</p>
              <p>Error: <code>${(e as Error).message}</code></p>
              <p>Please convert the estimate manually in Zoho Books.</p>`,
          });
        }
      }

      const invoiceRef = convertResult.invoiceNumber ?? estimateNumber;

      await Promise.all([
        sendEmail({
          from: FROM,
          to: [OWNER],
          subject: `✅ Payment received — ${customerName} — R${amountGross.toFixed(2)}${invoiceRef ? ` (${invoiceRef})` : ''}`,
          html: `<h2>Payment received via PayFast</h2>
            <p><strong>${customerName}</strong> (${customerEmail})</p>
            <p>Amount: <strong>R ${amountGross.toFixed(2)}</strong><br/>
            PayFast payment ID: ${data.pf_payment_id}<br/>
            Our reference: ${data.m_payment_id}<br/>
            ${convertResult.invoiceNumber ? `Invoice: <strong>${convertResult.invoiceNumber}</strong> (auto-created in Zoho)` : `Proforma: <strong>${estimateNumber}</strong>`}</p>`,
        }),
        customerEmail
          ? sendEmail({
              from: FROM,
              to: [customerEmail],
              reply_to: OWNER,
              subject: `Payment confirmed${invoiceRef ? ` — ${invoiceRef}` : ''} · Blank2Branded`,
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2>Thanks, ${data.name_first ?? ''}!</h2>
                <p>We've received your PayFast payment of <strong>R ${amountGross.toFixed(2)}</strong>${convertResult.invoiceNumber ? ` and issued tax invoice <strong>${convertResult.invoiceNumber}</strong>` : ''}. Your tax invoice will arrive shortly in a separate email from our billing system.</p>
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
