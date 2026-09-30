// Shared Google service-account auth for Edge Functions.
// Reads GOOGLE_SERVICE_ACCOUNT_JSON (the full service account key JSON) and
// exchanges it for a short-lived OAuth access token scoped to Search Console.
// Tokens are cached in memory for ~50 minutes (they last 1 hour).

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GSC_READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const GA4_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

// Cache per scope — different APIs need different scopes.
const cache = new Map<string, { token: string; expiresAt: number }>();

function getServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_JSON secret. Set it to the full contents of the service account key file.",
    );
  }
  const parsed = JSON.parse(raw);
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON does not look like a service account key (missing client_email or private_key).",
    );
  }
  return parsed as ServiceAccount;
}

function base64Url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwtRsaSha256(header: object, payload: object, privateKeyPem: string): Promise<string> {
  const keyPem = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = base64ToBytes(keyPem);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64Url(new Uint8Array(sig))}`;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function getGoogleAccessToken(scope: string = GSC_READONLY_SCOPE): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const hit = cache.get(scope);
  if (hit && hit.expiresAt - 120 > now) return hit.token;

  const sa = getServiceAccount();
  const iat = now;
  const exp = now + 3600;

  const assertion = await signJwtRsaSha256(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      scope,
      aud: TOKEN_URL,
      iat,
      exp,
    },
    sa.private_key,
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cache.set(scope, { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) });
  return cache.get(scope)!.token;
}
