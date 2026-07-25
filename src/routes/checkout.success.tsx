import { useEffect } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/static-router";
import { useCartStore } from "@/stores/cartStore";
import { trackEvent } from "@/lib/ads/pixels";

export function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();
  const ref = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") ?? ""
    : "";

  useEffect(() => {
    clearCart();
    try { trackEvent("purchase", { reference: ref }); } catch { /* noop */ }
  }, [clearCart, ref]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center space-y-6 rounded-xl border bg-card p-8 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Payment received</h1>
            <p className="text-muted-foreground">
              Thanks for your order{ref ? <> for reference <strong>{ref}</strong></> : ""}. We're
              generating your tax invoice now.
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 p-4 text-left text-sm text-muted-foreground flex gap-3">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              A tax invoice will arrive by email shortly from our billing system. Your order is now in
              production — we'll be in touch on WhatsApp with artwork and dispatch updates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><Link to="/shop">Continue shopping</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/">Back to home</Link></Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
