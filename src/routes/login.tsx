import { useState, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { navigate } from "@/lib/static-router";
import { toast } from "sonner";

function safeNext() {
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;
  return /^\/(?!\/)/.test(raw) ? raw : null;
}

export function LoginPage() {
  const { session, loading: sessionLoading } = useSession();
  const next = safeNext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  if (!sessionLoading && session) {
    if (next) {
      window.location.href = next;
      return null;
    }
    navigate("/admin");
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        if (next) {
          window.location.href = next;
          return;
        }
        navigate("/admin");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${next ?? "/admin"}` },
        });
        if (error) throw error;
        toast.success("Account created — check email if confirmation is required, then sign in.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
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
            {mode === "signin" ? "Admin Sign In" : "Create Admin Account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage your blog posts."
              : "The first account becomes the admin."}
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
