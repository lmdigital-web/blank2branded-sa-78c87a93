import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "@/lib/static-router";
import { Loader2, ShieldCheck, CircleCheck, CircleAlert } from "lucide-react";

type Result = Record<string, unknown> | null;

export function SupplierTestPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState("");
  const [loginPassed, setLoginPassed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!alive) return;
      setSignedIn(!authError && !!data.user);
      setEmail(data.user?.email ?? "");
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setSignedIn(!!session?.user);
      setEmail(session?.user?.email ?? "");
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function runAction(action: "inspect" | "login-test" | "feed-preview") {
    setBusy(action);
    setError("");
    setResult(null);
    if (action === "login-test" || action === "inspect") setLoginPassed(false);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("barron-supplier-sync", { body: { action } });
      if (invokeError) {
        let message = invokeError.message || "The supplier function could not be reached.";
        try {
          const context = (invokeError as any).context;
          if (context?.json) {
            const body = await context.json();
            if (body?.error) message = body.error;
          }
        } catch { /* Keep the safe, generic invocation error. */ }
        throw new Error(message);
      }
      setResult(data as Result);
      if (action === "login-test" && data?.success === true) setLoginPassed(true);
    } catch (e: any) {
      setError(e?.message || "Request failed. Please try again.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl p-6"><Loader2 className="animate-spin" /> Checking your sign-in…</main>;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Private supplier tools</div>
        <h1 className="text-3xl font-bold">Barron / Kevro Connection Test</h1>
        <p className="mt-2 text-muted-foreground">This page tests the supplier connection and, when requested, saves a feed preview to staging only. It does not update live products, prices, or stock.</p>
      </div>

      {!signedIn ? (
        <Alert><CircleAlert className="h-4 w-4" /><AlertTitle>Sign in required</AlertTitle><AlertDescription>You need to sign in with the supplier-authorized account first. <Link to="/login?next=/supplier-test" className="font-medium underline">Sign in here</Link>.</AlertDescription></Alert>
      ) : (
        <>
          <Alert><CircleCheck className="h-4 w-4" /><AlertTitle>Signed in</AlertTitle><AlertDescription>Current account: {email || "Authenticated account"}. Supplier access is checked securely by the backend and is independent of blog-admin permissions.</AlertDescription></Alert>
          <Card>
            <CardHeader><CardTitle>Step 1 — Check setup</CardTitle><CardDescription>Confirms supplier secrets are configured and your account is authorized. Does not contact Barron or write feed rows.</CardDescription></CardHeader>
            <CardContent><Button onClick={() => runAction("inspect")} disabled={!!busy}>{busy === "inspect" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Check configuration</Button></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Step 2 — Test Barron login</CardTitle><CardDescription>Contacts Barron to verify the credentials. Does not change catalogue data.</CardDescription></CardHeader>
            <CardContent><Button onClick={() => runAction("login-test")} disabled={!!busy}>{busy === "login-test" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Test Barron login</Button></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Step 3 — Preview the feed</CardTitle><CardDescription>Run the login test successfully first to unlock this step. This saves returned supplier rows to staging tables for review; it does not publish them to the shop.</CardDescription></CardHeader>
            <CardContent><Button variant="secondary" onClick={() => runAction("feed-preview")} disabled={!!busy || !loginPassed}>{busy === "feed-preview" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Fetch feed to staging</Button></CardContent>
          </Card>
        </>
      )}

      {error && <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>Test failed</AlertTitle><AlertDescription className="break-words">{error}</AlertDescription></Alert>}
      {result && <Card><CardHeader><CardTitle>Response</CardTitle><CardDescription>Safe response from the supplier integration. Credentials and session tokens are not displayed.</CardDescription></CardHeader><CardContent><pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-xs">{JSON.stringify(result, null, 2)}</pre></CardContent></Card>}
      <p className="text-xs text-muted-foreground">Use only on the integration preview while testing. No automatic or scheduled sync is enabled.</p>
    </main>
  );
}
