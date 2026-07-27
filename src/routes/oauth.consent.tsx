import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type AuthClient = { name?: string; client_name?: string; logo_uri?: string };
type Details = { client?: AuthClient; redirect_url?: string; redirect_to?: string; scope?: string };

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi | null {
  return ((supabase.auth as unknown as { oauth?: OAuthApi }).oauth) ?? null;
}

export function OAuthConsentPage() {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const authorizationId = new URLSearchParams(window.location.search).get("authorization_id") ?? "";

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the URL.");
        return;
      }
      const api = oauthApi();
      if (!api) {
        setError("OAuth is not available on this client.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error: err } = await api.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const api = oauthApi();
    if (!api) return;
    setBusy(true);
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "this app";

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          {error ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Authorization failed</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </>
          ) : !details ? (
            <p className="text-sm text-muted-foreground">Loading authorization request…</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Connect {clientName}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {clientName} is asking to use Blank2Branded tools on your behalf. It will be able to read your
                catalogue, orders and blog posts, and create blog drafts as you.
              </p>
              <div className="mt-6 flex gap-3">
                <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                  {busy ? "Please wait…" : "Approve"}
                </Button>
                <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
                  Deny
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
