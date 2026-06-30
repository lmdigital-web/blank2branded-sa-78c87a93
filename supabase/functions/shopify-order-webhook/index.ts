// Shopify orders/create webhook — verifies HMAC and stores attributed conversions.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const enc = new TextEncoder();

async function verifyHmac(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return expected === signature;
}

function extractRef(order: any): string | null {
  // Check note_attributes first (most reliable when cart attributes are used)
  const attrs: any[] = order?.note_attributes ?? [];
  for (const a of attrs) {
    if (a?.name === "ref" && typeof a?.value === "string") return a.value;
  }
  // Check landing_site / referring_site query string
  const candidates = [order?.landing_site, order?.referring_site];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const u = new URL(c, "https://blank2branded.co.za");
      const r = u.searchParams.get("ref");
      if (r) return r;
    } catch { /* */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const raw = await req.text();
  const signature = req.headers.get("X-Shopify-Hmac-Sha256") || "";
  const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");

  if (!secret || !(await verifyHmac(raw, signature, secret))) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const order = JSON.parse(raw);
    const ref = extractRef(order);
    if (!ref || !ref.startsWith("blog-")) {
      return new Response(JSON.stringify({ ok: true, skipped: "no blog ref" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const postId = ref.slice("blog-".length);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("blog_conversions").upsert(
      {
        post_id: postId,
        shopify_order_id: String(order.id),
        order_number: String(order.order_number ?? order.name ?? ""),
        ref_code: ref,
        total_amount: Number(order.total_price ?? order.current_total_price ?? 0),
        currency: order.currency ?? "ZAR",
        customer_email: order.email ?? null,
        line_items: order.line_items ?? null,
        ordered_at: order.created_at ?? new Date().toISOString(),
      },
      { onConflict: "shopify_order_id" },
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
