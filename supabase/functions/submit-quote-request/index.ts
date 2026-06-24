// supabase/functions/submit-quote-request/index.ts
// Receives a customer's cart + contact info, stores it in `quote_requests`
// (using the service role to bypass RLS), and sends an email notification
// to hello@blank2branded.co.za via Resend when RESEND_API_KEY is configured.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItem {
  productId: string;
  productHandle: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  quantity: number;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
}

interface Payload {
  customer: { name: string; email: string; phone?: string | null };
  message?: string | null;
  items: CartItem[];
  totals: { amount: string; currencyCode: string };
}

const NOTIFY_TO = "hello@blank2branded.co.za";
const FROM_ADDR = Deno.env.get("QUOTE_FROM_ADDRESS") ??
  "Blank2Branded Quotes <quotes@notify.blank2branded.co.za>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildHtml(p: Payload, id: string): string {
  const itemsRows = p.items.map((i) => {
    const opts = i.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", ");
    const lineTotal = (parseFloat(i.price.amount) * i.quantity).toFixed(2);
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">
        <strong>${escapeHtml(i.productTitle)}</strong><br/>
        <span style="color:#666;font-size:12px">${escapeHtml(opts || i.variantTitle)}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">
        ${i.price.currencyCode} ${parseFloat(i.price.amount).toFixed(2)}
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">
        ${i.price.currencyCode} ${lineTotal}
      </td>
    </tr>`;
  }).join("");

  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f6f6f9;padding:24px;color:#222">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ececf2">
    <div style="background:#111;color:#fff;padding:20px 24px">
      <h2 style="margin:0;font-size:18px">New Quote Request</h2>
      <p style="margin:4px 0 0;font-size:12px;opacity:.7">ID: ${id}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 8px"><strong>${escapeHtml(p.customer.name)}</strong></p>
      <p style="margin:0;color:#444">
        ${escapeHtml(p.customer.email)}${p.customer.phone ? " · " + escapeHtml(p.customer.phone) : ""}
      </p>
      ${p.message ? `<div style="margin:16px 0;padding:12px;background:#f6f6f9;border-radius:8px;white-space:pre-wrap">${escapeHtml(p.message)}</div>` : ""}
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
        <thead><tr style="background:#fafafa;text-align:left">
          <th style="padding:8px">Product</th>
          <th style="padding:8px;text-align:center">Qty</th>
          <th style="padding:8px;text-align:right">Unit</th>
          <th style="padding:8px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
        <tfoot><tr>
          <td colspan="3" style="padding:12px 8px;text-align:right;font-weight:700">Indicative total</td>
          <td style="padding:12px 8px;text-align:right;font-weight:700">${p.totals.currencyCode} ${p.totals.amount}</td>
        </tr></tfoot>
      </table>
      <p style="margin-top:24px;color:#888;font-size:12px">
        Reply directly to this email to send the customer a quote.
      </p>
    </div>
  </div></body></html>`;
}

function buildCustomerHtml(p: Payload): string {
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f6f6f9;padding:24px;color:#222">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ececf2;padding:24px">
    <h2 style="margin:0 0 12px">Thanks for your quote request, ${escapeHtml(p.customer.name)}!</h2>
    <p style="color:#444;line-height:1.5;margin:0 0 12px">
      We've received your cart of <strong>${p.items.reduce((s, i) => s + i.quantity, 0)} item(s)</strong>
      and our team will email you a tailored quote within one business day.
    </p>
    <p style="color:#444;line-height:1.5;margin:0 0 12px">
      In the meantime, feel free to WhatsApp us on <a href="https://wa.me/27698384045">+27 69 838 4045</a>
      if you'd like to discuss artwork or timelines.
    </p>
    <p style="color:#888;font-size:12px;margin-top:24px">— The Blank2Branded team</p>
  </div></body></html>`;
}

async function sendEmail(opts: {
  to: string; from: string; subject: string; html: string; replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[submit-quote-request] RESEND_API_KEY not set — skipping email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[submit-quote-request] resend error", res.status, text);
    return { ok: false, error: text };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload?.customer?.name || !payload?.customer?.email) {
    return new Response(JSON.stringify({ error: "name and email required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return new Response(JSON.stringify({ error: "cart is empty" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const itemCount = payload.items.reduce((s, i) => s + i.quantity, 0);

  const { data: inserted, error } = await supabase
    .from("quote_requests")
    .insert({
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone ?? null,
      message: payload.message ?? null,
      items: payload.items,
      item_count: itemCount,
      estimated_total: parseFloat(payload.totals.amount),
      currency_code: payload.totals.currencyCode,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submit-quote-request] insert failed", error);
    return new Response(JSON.stringify({ error: "could not save quote" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const id = inserted!.id;

  // Notify team + customer in parallel; failures don't block success.
  const [adminRes, custRes] = await Promise.all([
    sendEmail({
      to: NOTIFY_TO,
      from: FROM_ADDR,
      subject: `New quote request · ${payload.customer.name} · ${itemCount} item(s)`,
      html: buildHtml(payload, id),
      replyTo: payload.customer.email,
    }),
    sendEmail({
      to: payload.customer.email,
      from: FROM_ADDR,
      subject: "We've received your quote request — Blank2Branded",
      html: buildCustomerHtml(payload),
      replyTo: NOTIFY_TO,
    }),
  ]);

  return new Response(
    JSON.stringify({
      id,
      stored: true,
      emails: { admin: adminRes.ok, customer: custRes.ok },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
