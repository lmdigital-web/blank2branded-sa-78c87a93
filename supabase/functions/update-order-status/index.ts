// supabase/functions/update-order-status/index.ts
// Admin-only: updates an order's status and/or tracking number.
// Sends a "shipped" email to the customer when the status transitions to shipped.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED = new Set([
  "pending_payment", "paid", "in_production", "shipped", "delivered", "cancelled", "refunded",
]);

function jres(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const from = Deno.env.get("QUOTE_FROM_ADDRESS") ??
    "Blank2Branded <hello@notify.blank2branded.co.za>";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  }).catch((e) => console.error("[update-order-status] resend error", e));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jres({ error: "method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return jres({ error: "not signed in" }, 401);
  const jwt = auth.slice(7);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: u, error: uErr } = await authClient.auth.getUser();
  if (uErr || !u.user) return jres({ error: "not signed in" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleRow } = await admin
    .from("user_roles").select("role")
    .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) return jres({ error: "forbidden" }, 403);

  let body: { order_id: string; status?: string; tracking_number?: string | null; internal_notes?: string | null };
  try { body = await req.json(); } catch { return jres({ error: "invalid json" }, 400); }
  if (!body?.order_id) return jres({ error: "order_id required" }, 400);

  const patch: Record<string, unknown> = {};
  if (body.status) {
    if (!ALLOWED.has(body.status)) return jres({ error: "invalid status" }, 400);
    patch.status = body.status;
  }
  if (body.tracking_number !== undefined) patch.tracking_number = body.tracking_number;
  if (body.internal_notes !== undefined) patch.internal_notes = body.internal_notes;

  if (Object.keys(patch).length === 0) return jres({ error: "no changes" }, 400);

  const { data: prev } = await admin.from("orders").select("*").eq("id", body.order_id).single();
  if (!prev) return jres({ error: "order not found" }, 404);

  const { data: updated, error: uPatchErr } = await admin
    .from("orders").update(patch).eq("id", body.order_id).select("*").single();
  if (uPatchErr) return jres({ error: uPatchErr.message }, 500);

  await admin.from("order_events").insert({
    order_id: body.order_id,
    event_type: "admin_update",
    message: Object.entries(patch).map(([k, v]) => `${k}: ${v ?? "—"}`).join("; "),
    metadata: patch,
    created_by: u.user.id,
  });

  // Email customer when shipped
  if (body.status === "shipped" && prev.status !== "shipped") {
    const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;padding:24px;color:#222">
      <h2>Your order ${updated.order_number} has shipped</h2>
      <p>Hi ${updated.customer_name}, good news — your order is on its way.</p>
      ${updated.tracking_number ? `<p><strong>Tracking number:</strong> ${updated.tracking_number}</p>` : ""}
      <p style="color:#888;font-size:12px;margin-top:24px">— Blank2Branded</p>
    </body></html>`;
    await sendEmail(updated.customer_email, `Order ${updated.order_number} shipped`, html);
  }

  return jres({ ok: true, order: updated });
});
