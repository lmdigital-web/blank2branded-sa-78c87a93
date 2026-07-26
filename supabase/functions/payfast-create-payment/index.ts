import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const MERCHANT_ID = Deno.env.get('PAYFAST_MERCHANT_ID');
const MERCHANT_KEY = Deno.env.get('PAYFAST_MERCHANT_KEY');
const PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') ?? '';
const USE_PASSPHRASE = (Deno.env.get('PAYFAST_USE_PASSPHRASE') ?? 'false').toLowerCase() === 'true';
const MODE = (Deno.env.get('PAYFAST_MODE') ?? 'sandbox').toLowerCase();
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://blank2branded.co.za';

const PROCESS_URL =
  MODE === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';

const BodySchema = z.object({
  customer: z.object({
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    email: z.string().email(),
    phone: z.string().min(5).max(20),
  }),
  amount: z.number().positive(),
  itemName: z.string().min(1).max(100),
  itemDescription: z.string().max(255).optional().default(''),
  invoiceNumber: z.string().optional(),
  estimateId: z.string().optional(),
  estimateNumber: z.string().optional(),
  paymentId: z.string().min(1).max(100),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  siteUrl: z.string().url().optional(),
});

// PayFast expects `+` for spaces and uppercase hex escapes (PHP urlencode).
const pfEncode = (v: string) =>
  encodeURIComponent(v)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function md5(input: string): Promise<string> {
  // Deno's std md5 via crypto subtle isn't available; use a tiny impl via Web Crypto? MD5 not supported.
  // Use the Deno std hash via npm:blueimp-md5.
  const md5fn = (await import('npm:blueimp-md5@2.19.0')).default as (s: string) => string;
  return md5fn(input);
}

function buildSignatureBase(fields: Record<string, string>): string {
  return Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${pfEncode(String(v).trim())}`)
    .join('&');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!MERCHANT_ID || !MERCHANT_KEY) throw new Error('PayFast is not configured');
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { customer, amount, itemName, itemDescription, invoiceNumber, estimateId, estimateNumber, paymentId, returnUrl, cancelUrl, siteUrl } = parsed.data;

    const base = (siteUrl ?? SITE_URL).replace(/\/$/, '');
    const ref = estimateNumber ?? invoiceNumber ?? paymentId;
    const resolvedReturn = returnUrl ?? `${base}/checkout/success/?ref=${encodeURIComponent(ref)}`;
    const resolvedCancel = cancelUrl ?? `${base}/checkout/cancelled/`;

    // Fields in the exact order PayFast documents for the signature.
    const rawFields: Record<string, string> = {
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      return_url: resolvedReturn,
      cancel_url: resolvedCancel,
      notify_url: `https://enpdahmqwhdukbnykqyy.functions.supabase.co/payfast-itn`,
      name_first: customer.firstName,
      name_last: customer.lastName,
      email_address: customer.email,
      cell_number: (() => {
        // PayFast expects a 10-digit SA number starting with 0. Strip non-digits
        // and normalise +27 / 27 prefixes to 0.
        let d = customer.phone.replace(/\D/g, '');
        if (d.startsWith('27') && d.length === 11) d = '0' + d.slice(2);
        return d;
      })(),
      m_payment_id: paymentId,
      amount: amount.toFixed(2),
      item_name: itemName.slice(0, 100),
      item_description: (itemDescription || itemName).slice(0, 255),
      custom_str1: invoiceNumber ?? estimateNumber ?? '',
      custom_str2: customer.email,
      custom_str3: `${customer.firstName} ${customer.lastName}`,
      custom_str4: estimateId ?? '',
      custom_str5: estimateNumber ?? '',
    };

    // Strip empty values — PayFast recomputes the signature from POSTed fields,
    // so any empty field sent to the form but excluded from our sig would break parity.
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawFields)) {
      const trimmed = String(v ?? '').trim();
      if (trimmed !== '') fields[k] = trimmed;
    }

    let sigBase = buildSignatureBase(fields);
    if (USE_PASSPHRASE && PASSPHRASE.trim()) sigBase += `&passphrase=${pfEncode(PASSPHRASE.trim())}`;
    const signature = await md5(sigBase);

    return new Response(
      JSON.stringify({
        process_url: PROCESS_URL,
        fields: { ...fields, signature },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('payfast-create-payment error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
