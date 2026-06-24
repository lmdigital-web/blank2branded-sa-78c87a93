// supabase/functions/payfast-itn/index.ts
// PayFast Instant Transaction Notification webhook.
// Verifies the signature, posts back to PayFast to confirm legitimacy,
// then marks the matching order as paid and sends a confirmation email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYFAST_MODE = (Deno.env.get("PAYFAST_MODE") ?? "sandbox").toLowerCase();
const PAYFAST_VALIDATE_HOST =
  PAYFAST_MODE === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";
const PAYFAST_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE") ?? "";

function payfastEncode(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

function md5Hex(message: Uint8Array): string {
  function rotl(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }
  const r = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
  ];
  const k = new Uint32Array(64);
  for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  const origLen = message.length;
  const bitLen = BigInt(origLen) * 8n;
  const withOne = new Uint8Array(((origLen + 9 + 63) >> 6) << 6);
  withOne.set(message); withOne[origLen] = 0x80;
  const view = new DataView(withOne.buffer);
  view.setUint32(withOne.length - 8, Number(bitLen & 0xffffffffn), true);
  view.setUint32(withOne.length - 4, Number(bitLen >> 32n), true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for (let off = 0; off < withOne.length; off += 64) {
    const m = new Uint32Array(16);
    for (let i = 0; i < 16; i++) m[i] = view.getUint32(off + i*4, true);
    let a=a0,b=b0,c=c0,d=d0;
    for (let i = 0; i < 64; i++) {
      let f:number,g:number;
      if (i<16){f=(b&c)|(~b&d);g=i;}
      else if (i<32){f=(d&b)|(~d&c);g=(5*i+1)%16;}
      else if (i<48){f=b^c^d;g=(3*i+5)%16;}
      else {f=c^(b|~d);g=(7*i)%16;}
      const t=d; d=c; c=b;
      b=(b+rotl((a+f+k[i]+m[g])>>>0, r[i]))>>>0;
      a=t;
    }
    a0=(a0+a)>>>0;b0=(b0+b)>>>0;c0=(c0+c)>>>0;d0=(d0+d)>>>0;
  }
  const toHex=(n:number)=>Array.from(new Uint8Array(new Uint32Array([n]).buffer))
    .map((b)=>b.toString(16).padStart(2,"0")).join("");
  return toHex(a0)+toHex(b0)+toHex(c0)+toHex(d0);
}

function buildOrderEmail(o: any, items: any[]): string {
  const rows = items.map((i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">
        <strong>${i.product_name}</strong><br/>
        <span style="color:#666;font-size:12px">${i.variant_label ?? ""}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R ${Number(i.line_total).toFixed(2)}</td>
    </tr>`).join("");
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f6f6f9;padding:24px;color:#222">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #ececf2;overflow:hidden">
      <div style="background:#111;color:#fff;padding:20px 24px">
        <h2 style="margin:0;font-size:18px">Order ${o.order_number} confirmed</h2>
        <p style="margin:4px 0 0;font-size:12px;opacity:.7">Thanks for your order, ${o.customer_name}!</p>
      </div>
      <div style="padding:24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr style="background:#fafafa;text-align:left">
            <th style="padding:8px">Item</th>
            <th style="padding:8px;text-align:center">Qty</th>
            <th style="padding:8px;text-align:right">Total</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr><td colspan="2" style="padding:6px 8px;text-align:right">Subtotal</td><td style="padding:6px 8px;text-align:right">R ${Number(o.subtotal).toFixed(2)}</td></tr>
            <tr><td colspan="2" style="padding:6px 8px;text-align:right">Shipping</td><td style="padding:6px 8px;text-align:right">R ${Number(o.shipping_amount).toFixed(2)}</td></tr>
            <tr><td colspan="2" style="padding:10px 8px;text-align:right;font-weight:700">Total paid</td><td style="padding:10px 8px;text-align:right;font-weight:700">R ${Number(o.total_amount).toFixed(2)}</td></tr>
          </tfoot>
        </table>
        <p style="margin-top:24px;color:#444">Shipping to:<br/>
          <strong>${o.customer_name}</strong><br/>
          ${o.ship_line1}${o.ship_line2 ? ", " + o.ship_line2 : ""}<br/>
          ${o.ship_suburb ? o.ship_suburb + ", " : ""}${o.ship_city}, ${o.ship_province} ${o.ship_postal_code}
        </p>
        <p style="margin-top:24px;color:#888;font-size:12px">We'll email tracking details as soon as your order ships.</p>
      </div>
    </div></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const from = Deno.env.get("QUOTE_FROM_ADDRESS") ??
    "Blank2Branded <hello@notify.blank2branded.co.za>";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, reply_to: replyTo }),
  }).catch((e) => console.error("[itn] resend error", e));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  // PayFast always sends 200 expected — we acknowledge then process.
  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);
  const data: Record<string, string> = {};
  for (const [k, v] of params.entries()) data[k] = v;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const orderNumber = data["m_payment_id"];
  const signatureProvided = data["signature"];
  delete data["signature"];

  // Verify signature
  const parts: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v == null || v === "") continue;
    parts.push(`${k}=${payfastEncode(String(v).trim())}`);
  }
  let raw = parts.join("&");
  if (PAYFAST_PASSPHRASE) raw += `&passphrase=${payfastEncode(PAYFAST_PASSPHRASE)}`;
  const expected = md5Hex(new TextEncoder().encode(raw));

  if (expected !== signatureProvided) {
    console.error("[itn] signature mismatch", { orderNumber });
    await admin.from("order_events").insert({
      order_id: data["custom_str1"] || null,
      event_type: "itn_signature_mismatch",
      metadata: { received: signatureProvided, expected },
    }).catch(() => {});
    return new Response("invalid signature", { status: 400 });
  }

  // Validate with PayFast
  try {
    const validateRes = await fetch(PAYFAST_VALIDATE_HOST, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyText,
    });
    const text = (await validateRes.text()).trim();
    if (!text.startsWith("VALID")) {
      console.error("[itn] validate failed", text);
      return new Response("invalid", { status: 400 });
    }
  } catch (e) {
    console.error("[itn] validate error", e);
    // continue anyway — signature passed
  }

  if (!orderNumber) return new Response("missing m_payment_id", { status: 400 });

  // Look up order
  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();
  if (oErr || !order) {
    console.error("[itn] order not found", orderNumber);
    return new Response("order not found", { status: 404 });
  }

  const status = data["payment_status"];
  const amountGross = Number(data["amount_gross"] ?? "0");
  if (Math.abs(amountGross - Number(order.total_amount)) > 0.01) {
    await admin.from("order_events").insert({
      order_id: order.id,
      event_type: "itn_amount_mismatch",
      metadata: { received: amountGross, expected: Number(order.total_amount) },
    });
    return new Response("amount mismatch", { status: 400 });
  }

  if (status === "COMPLETE" && order.status === "pending_payment") {
    await admin.from("orders").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payfast_payment_id: data["pf_payment_id"] ?? null,
      payfast_token: data["token"] ?? null,
    }).eq("id", order.id);

    await admin.from("order_events").insert({
      order_id: order.id,
      event_type: "payment_received",
      message: `PayFast confirmed payment of R ${amountGross.toFixed(2)}`,
      metadata: data,
    });

    // Load items + send emails
    const { data: items } = await admin
      .from("order_items").select("*").eq("order_id", order.id);

    const html = buildOrderEmail(order, items ?? []);
    await Promise.all([
      sendEmail(order.customer_email, `Order ${order.order_number} confirmed`, html),
      sendEmail("hello@blank2branded.co.za", `New paid order ${order.order_number}`, html),
    ]);
  } else if (status === "CANCELLED" || status === "FAILED") {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    await admin.from("order_events").insert({
      order_id: order.id,
      event_type: "payment_failed",
      message: `PayFast status: ${status}`,
      metadata: data,
    });
  }

  return new Response("OK", { status: 200 });
});
