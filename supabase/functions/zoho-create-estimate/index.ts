import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const GATEWAY = "https://connector-gateway.lovable.dev/zoho_books";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const ZOHO_KEY = Deno.env.get("ZOHO_BOOKS_API_KEY");

const BodySchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    phone: z.string().trim().min(4).max(30),
    email: z.string().trim().email().max(160),
    address: z.string().trim().min(4).max(500),
  }),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(300),
        description: z.string().max(500).optional(),
        quantity: z.number().int().min(1).max(10000),
        rate: z.number().min(0),
      }),
    )
    .min(1),
  shipping: z.number().min(0).default(0),
  currency: z.string().default("ZAR"),
  notes: z.string().max(1000).optional(),
});

function authHeaders() {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": ZOHO_KEY!,
    "Content-Type": "application/json",
  };
}

async function zoho(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  if (!res.ok) throw new Error(`Zoho ${path} [${res.status}]: ${text}`);
  return json as any;
}

async function getOrgId(): Promise<string> {
  const data = await zoho("/organizations");
  const orgs = data?.organizations ?? [];
  if (!orgs.length) throw new Error("No Zoho Books organizations found");
  return String(orgs[0].organization_id);
}

async function findOrCreateContact(orgId: string, c: z.infer<typeof BodySchema>["customer"]) {
  const search = await zoho(
    `/contacts?organization_id=${orgId}&email=${encodeURIComponent(c.email)}`,
  );
  const existing = (search?.contacts ?? [])[0];
  if (existing?.contact_id) return String(existing.contact_id);

  const created = await zoho(`/contacts?organization_id=${orgId}`, {
    method: "POST",
    body: JSON.stringify({
      contact_name: `${c.firstName} ${c.lastName}`.trim(),
      contact_type: "customer",
      contact_persons: [
        {
          first_name: c.firstName,
          last_name: c.lastName,
          email: c.email,
          phone: c.phone,
          is_primary_contact: true,
        },
      ],
      billing_address: { address: c.address, country: "South Africa" },
      shipping_address: { address: c.address, country: "South Africa" },
    }),
  });
  const id = created?.contact?.contact_id;
  if (!id) throw new Error(`Contact create returned no id: ${JSON.stringify(created)}`);
  return String(id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY || !ZOHO_KEY) throw new Error("Zoho Books connector not configured");
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { customer, items, shipping, currency, notes } = parsed.data;

    const orgId = await getOrgId();
    const contactId = await findOrCreateContact(orgId, customer);

    const estimate = await zoho(`/estimates?organization_id=${orgId}`, {
      method: "POST",
      body: JSON.stringify({
        customer_id: contactId,
        currency_code: currency,
        line_items: items.map((i) => ({
          name: i.name.slice(0, 100),
          description: i.description ?? "",
          rate: i.rate,
          quantity: i.quantity,
        })),
        shipping_charge: shipping,
        notes: notes
          ? `${notes}\n\nThis is a proforma invoice. Once payment is received, a tax invoice will be issued automatically.`
          : "This is a proforma invoice. Once payment is received, a tax invoice will be issued automatically.",
        terms: "Payment via PayFast. Order enters production once payment clears.",
      }),
    });

    const est = estimate?.estimate ?? {};

    // Best-effort email of the proforma
    try {
      await zoho(`/estimates/${est.estimate_id}/email?organization_id=${orgId}`, {
        method: "POST",
        body: JSON.stringify({
          to_mail_ids: [customer.email],
          subject: `Proforma invoice ${est.estimate_number ?? ""} from Blank2Branded`,
          body:
            "Hi,\n\nPlease find your proforma invoice attached. You'll receive a tax invoice once your PayFast payment clears.\n\nBlank2Branded",
        }),
      });
    } catch (e) {
      console.warn("Proforma email step failed:", (e as Error).message);
    }

    return new Response(
      JSON.stringify({
        estimate_id: est.estimate_id,
        estimate_number: est.estimate_number,
        estimate_url: est.estimate_url,
        organization_id: orgId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("zoho-create-estimate error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
