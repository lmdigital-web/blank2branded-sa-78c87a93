// supabase/functions/create-payfast-checkout/index.ts
// Validates the customer's cart against the catalogue, creates an order in
// `pending_payment` status, and returns a signed PayFast redirect URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface ShippingAddress {
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  suburb?: string | null;
  city: string;
  province: string;
  postal_code: string;
  country?: string;
}

interface Payload {
  items: IncomingItem[];
  shipping: ShippingAddress;
  save_address?: boolean;
  address_label?: string | null;
}

const SHIPPING_AMOUNT = 120.0;
const MIN_APPAREL = 3;

const PAYFAST_MODE = (Deno.env.get("PAYFAST_MODE") ?? "sandbox").toLowerCase();
const PAYFAST_HOST =
  PAYFAST_MODE === "live" ? "https://www.payfast.co.za" : "https://sandbox.payfast.co.za";
const PAYFAST_MERCHANT_ID = Deno.env.get("PAYFAST_MERCHANT_ID") ?? "";
const PAYFAST_MERCHANT_KEY = Deno.env.get("PAYFAST_MERCHANT_KEY") ?? "";
const PAYFAST_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE") ?? "";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://blank2branded.co.za";

function jres(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// PayFast signature: URL-encode (RFC1738 / "+" for spaces), join in submission
// order, append passphrase, then MD5.
function payfastEncode(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

async function md5(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  // Web Crypto doesn't expose MD5. Implement it inline for PayFast.
  return md5Hex(data);
}

// Minimal MD5 implementation (public-domain rosetta-style port).
function md5Hex(message: Uint8Array): string {
  function rotl(x: number, n: number) {
    return (x << n) | (x >>> (32 - n));
  }
  const r = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const k = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  }
  const origLen = message.length;
  const bitLen = BigInt(origLen) * 8n;
  const withOne = new Uint8Array(((origLen + 9 + 63) >> 6) << 6);
  withOne.set(message);
  withOne[origLen] = 0x80;
  const view = new DataView(withOne.buffer);
  view.setUint32(withOne.length - 8, Number(bitLen & 0xffffffffn), true);
  view.setUint32(withOne.length - 4, Number(bitLen >> 32n), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < withOne.length; off += 64) {
    const m = new Uint32Array(16);
    for (let i = 0; i < 16; i++) m[i] = view.getUint32(off + i * 4, true);
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const temp = d; d = c; c = b;
      b = (b + rotl((a + f + k[i] + m[g]) >>> 0, r[i])) >>> 0;
      a = temp;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  const toHex = (n: number) =>
    Array.from(new Uint8Array(new Uint32Array([n]).buffer))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

async function payfastSignature(fields: Record<string, string>): Promise<string> {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v == null || v === "") continue;
    parts.push(`${k}=${payfastEncode(v.trim())}`);
  }
  let raw = parts.join("&");
  if (PAYFAST_PASSPHRASE) raw += `&passphrase=${payfastEncode(PAYFAST_PASSPHRASE)}`;
  return await md5(raw);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jres({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jres({ error: "Not signed in" }, 401);
  }
  const jwt = authHeader.slice("Bearer ".length);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userData.user) return jres({ error: "Not signed in" }, 401);
  const user = userData.user;

  let payload: Payload;
  try { payload = await req.json(); }
  catch { return jres({ error: "invalid json" }, 400); }

  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    return jres({ error: "Cart is empty" }, 400);
  }
  const ship = payload.shipping;
  for (const k of ["recipient_name", "phone", "line1", "city", "province", "postal_code"] as const) {
    if (!ship?.[k] || String(ship[k]).trim().length < 2) {
      return jres({ error: `Missing shipping field: ${k}` }, 400);
    }
  }

  // Normalise quantities and dedupe by variant
  const wanted = new Map<string, number>();
  for (const it of payload.items) {
    if (!it.variantId) continue;
    const q = Math.max(1, Math.floor(Number(it.quantity) || 0));
    wanted.set(it.variantId, (wanted.get(it.variantId) ?? 0) + q);
  }
  const variantIds = [...wanted.keys()];
  if (variantIds.length === 0) return jres({ error: "Cart is empty" }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // Pull variants + product + category for MOQ check
  const { data: variants, error: vErr } = await admin
    .from("shop_product_variants")
    .select(`
      id, price, currency_code, available, sku,
      option1_name, option1_value, option2_name, option2_value, option3_name, option3_value,
      shop_products!inner (
        id, handle, title, status,
        shop_categories ( id, name, slug, parent_id )
      )
    `)
    .in("id", variantIds);

  if (vErr) {
    console.error("[create-payfast-checkout] variant lookup failed", vErr);
    return jres({ error: "Could not load cart" }, 500);
  }

  if (!variants || variants.length !== variantIds.length) {
    return jres({ error: "Some items are no longer available" }, 400);
  }

  // Look up category names (incl. parents) to determine apparel MOQ
  const catIds = new Set<string>();
  for (const v of variants) {
    const cat = (v as any).shop_products?.shop_categories;
    if (cat?.id) catIds.add(cat.id);
    if (cat?.parent_id) catIds.add(cat.parent_id);
  }
  const { data: cats } = await admin
    .from("shop_categories")
    .select("id, name, slug, parent_id")
    .in("id", [...catIds]);
  const catMap = new Map((cats ?? []).map((c) => [c.id, c]));

  // First image per product for snapshots
  const productIds = [...new Set(variants.map((v) => (v as any).shop_products.id as string))];
  const { data: imgs } = await admin
    .from("shop_product_images")
    .select("product_id, url, position")
    .in("product_id", productIds)
    .order("position", { ascending: true });
  const imageByProduct = new Map<string, string>();
  for (const i of imgs ?? []) {
    if (!imageByProduct.has(i.product_id as string)) {
      imageByProduct.set(i.product_id as string, (i as any).url as string);
    }
  }

  // Validate & build snapshot
  let subtotal = 0;
  let apparelQty = 0;
  const itemRows: Array<{
    product_id: string; variant_id: string;
    product_name: string; variant_label: string | null; sku: string | null;
    unit_price: number; quantity: number; line_total: number; image_url: string | null;
  }> = [];

  for (const v of variants) {
    const qty = wanted.get(v.id as string) ?? 0;
    if (qty <= 0) continue;
    if ((v as any).available === false) {
      return jres({ error: `"${(v as any).shop_products.title}" is unavailable` }, 400);
    }
    if ((v as any).shop_products.status !== "published") {
      return jres({ error: `"${(v as any).shop_products.title}" is not for sale` }, 400);
    }
    const unit = Number((v as any).price);
    if (!isFinite(unit) || unit < 0) return jres({ error: "Invalid price" }, 400);

    const optParts: string[] = [];
    for (const i of [1, 2, 3]) {
      const val = (v as any)[`option${i}_value`];
      if (val) optParts.push(val);
    }

    const productId = (v as any).shop_products.id as string;
    const line = +(unit * qty).toFixed(2);
    subtotal += line;

    // Determine if this counts as "apparel" for MOQ
    const cat = (v as any).shop_products.shop_categories;
    let topName: string | null = cat?.name ?? null;
    if (cat?.parent_id) {
      const parent = catMap.get(cat.parent_id);
      if (parent) topName = (parent as any).name as string;
    }
    if (topName && topName.toLowerCase() === "apparel") apparelQty += qty;

    itemRows.push({
      product_id: productId,
      variant_id: v.id as string,
      product_name: (v as any).shop_products.title as string,
      variant_label: optParts.join(" / ") || null,
      sku: (v as any).sku ?? null,
      unit_price: unit,
      quantity: qty,
      line_total: line,
      image_url: imageByProduct.get(productId) ?? null,
    });
  }

  if (apparelQty > 0 && apparelQty < MIN_APPAREL) {
    return jres({
      error: `Minimum 3 apparel items required (you have ${apparelQty}).`,
    }, 400);
  }

  subtotal = +subtotal.toFixed(2);
  const total = +(subtotal + SHIPPING_AMOUNT).toFixed(2);

  // Generate order number
  const { data: orderNumRow, error: numErr } = await admin
    .rpc("generate_order_number");
  if (numErr || !orderNumRow) {
    console.error("[create-payfast-checkout] order_number failed", numErr);
    return jres({ error: "Could not create order" }, 500);
  }
  const orderNumber = orderNumRow as unknown as string;

  // Create order
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: "pending_payment",
      customer_email: user.email ?? "",
      customer_phone: ship.phone,
      customer_name: ship.recipient_name,
      ship_line1: ship.line1,
      ship_line2: ship.line2 ?? null,
      ship_suburb: ship.suburb ?? null,
      ship_city: ship.city,
      ship_province: ship.province,
      ship_postal_code: ship.postal_code,
      ship_country: ship.country ?? "South Africa",
      subtotal,
      shipping_amount: SHIPPING_AMOUNT,
      total_amount: total,
      payment_provider: "payfast",
      payment_mode: PAYFAST_MODE,
    })
    .select("id, order_number")
    .single();

  if (oErr || !order) {
    console.error("[create-payfast-checkout] order insert failed", oErr);
    return jres({ error: "Could not create order" }, 500);
  }

  // Insert items
  const { error: itemsErr } = await admin
    .from("order_items")
    .insert(itemRows.map((r) => ({ ...r, order_id: order.id })));
  if (itemsErr) {
    console.error("[create-payfast-checkout] items insert failed", itemsErr);
    return jres({ error: "Could not save order items" }, 500);
  }

  // Order event
  await admin.from("order_events").insert({
    order_id: order.id,
    event_type: "created",
    message: "Order created, awaiting PayFast payment",
    created_by: user.id,
  });

  // Optionally save address
  if (payload.save_address) {
    await admin.from("customer_addresses").insert({
      user_id: user.id,
      label: payload.address_label ?? "Default",
      recipient_name: ship.recipient_name,
      phone: ship.phone,
      line1: ship.line1,
      line2: ship.line2 ?? null,
      suburb: ship.suburb ?? null,
      city: ship.city,
      province: ship.province,
      postal_code: ship.postal_code,
      country: ship.country ?? "South Africa",
    });
  }

  // Build PayFast fields (ORDER MATTERS for signature)
  const itemName = `Order ${orderNumber}`;
  const itemDesc = itemRows
    .map((r) => `${r.quantity}× ${r.product_name}${r.variant_label ? " (" + r.variant_label + ")" : ""}`)
    .join("; ")
    .slice(0, 250);

  const [firstName, ...rest] = ship.recipient_name.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const fields: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${SITE_URL}/checkout/success?order=${orderNumber}`,
    cancel_url: `${SITE_URL}/checkout/cancelled?order=${orderNumber}`,
    notify_url: `${supabaseUrl}/functions/v1/payfast-itn`,
    name_first: firstName,
    name_last: lastName,
    email_address: user.email ?? "",
    cell_number: ship.phone.replace(/\D/g, "").slice(-10),
    m_payment_id: orderNumber,
    amount: total.toFixed(2),
    item_name: itemName,
    item_description: itemDesc,
    custom_str1: order.id,
    custom_str2: user.id,
    email_confirmation: "1",
    confirmation_address: "hello@blank2branded.co.za",
  };

  const signature = await payfastSignature(fields);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) params.append(k, v);
  params.append("signature", signature);

  const redirectUrl = `${PAYFAST_HOST}/eng/process?${params.toString()}`;

  return jres({
    order_id: order.id,
    order_number: orderNumber,
    redirect_url: redirectUrl,
  });
});
