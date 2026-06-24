import { useState, useEffect, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { navigate } from "@/lib/static-router";
import { toast } from "sonner";

function readRedirect(): string {
  if (typeof window === "undefined") return "/account";
  const p = new URLSearchParams(window.location.search).get("redirect");
  if (!p || !p.startsWith("/")) return "/account";
  return p;
}

export function LoginPage() {
  const { session, loading: sessionLoading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState("/account");

  useEffect(() => { setRedirect(readRedirect()); }, []);

  useEffect(() => {
    if (!sessionLoading && session) navigate(redirect);
  }, [session, sessionLoading, redirect]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate(redirect);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${redirect}` },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
        navigate(redirect);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to checkout or view your orders."
              : "Create an account to checkout and track your orders."}
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "No account yet? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
