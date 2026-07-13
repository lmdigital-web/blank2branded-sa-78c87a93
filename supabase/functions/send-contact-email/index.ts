import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  business: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(3).max(30),
  orderType: z.string().trim().min(1).max(80),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1).max(5000),
});

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TO = 'hello@blank2branded.co.za';
// Resend requires a verified sender domain. Using their onboarding sender is safe;
// replies go to the customer via reply_to.
const FROM = 'Blank2Branded Contact <onboarding@resend.dev>';

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const d = parsed.data;

    const subjectLine = d.subject?.trim()
      ? `New enquiry: ${d.subject} — ${d.business}`
      : `New enquiry from ${d.business}`;

    const html = `
      <h2>New enquiry from the website</h2>
      <p><strong>Name:</strong> ${escape(d.name)}</p>
      <p><strong>Business:</strong> ${escape(d.business)}</p>
      <p><strong>Email:</strong> ${escape(d.email)}</p>
      <p><strong>Phone:</strong> ${escape(d.phone)}</p>
      <p><strong>Order type:</strong> ${escape(d.orderType)}</p>
      ${d.subject ? `<p><strong>Subject:</strong> ${escape(d.subject)}</p>` : ''}
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${escape(d.message)}</pre>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: d.email,
        subject: subjectLine,
        html,
      }),
    });

    if (!resp.ok) {
      const details = await resp.text();
      console.error('Resend error', resp.status, details);
      return new Response(JSON.stringify({ error: 'Email send failed', status: resp.status, details }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
