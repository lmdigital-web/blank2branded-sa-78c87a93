import { createClient } from "npm:@supabase/supabase-js@2";

type CorsHeaders = Record<string, string>;

function response(cors: CorsHeaders, message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function bearer(req: Request): string | null {
  const match = (req.headers.get("Authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireAdmin(req: Request, cors: CorsHeaders): Promise<Response | null> {
  const token = bearer(req);
  if (!token) return response(cors, "Unauthorized", 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return response(cors, "Authorization service unavailable", 503);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return response(cors, "Unauthorized", 401);

  const { data: role, error: roleError } = await admin
    .from("user_roles").select("user_id")
    .eq("user_id", data.user.id).eq("role", "admin").maybeSingle();

  if (roleError) {
    console.error("Admin role lookup failed:", roleError.message);
    return response(cors, "Unable to verify administrator permissions", 503);
  }
  if (!role) return response(cors, "Forbidden", 403);
  return null;
}

export async function requireAdminOrServiceRole(req: Request, cors: CorsHeaders): Promise<Response | null> {
  const token = bearer(req);
  if (!token) return response(cors, "Unauthorized", 401);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return null;
  return await requireAdmin(req, cors);
}

export function requireServiceRole(req: Request, cors: CorsHeaders): Response | null {
  const token = bearer(req);
  if (!token) return response(cors, "Unauthorized", 401);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return response(cors, "Authorization service unavailable", 503);
  if (token !== serviceKey) return response(cors, "Forbidden", 403);
  return null;
}
