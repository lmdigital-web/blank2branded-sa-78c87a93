import { useEffect } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/static-router";
import { useCartStore } from "@/stores/cartStore";

export function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();
  const ref = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") ?? ""
    : "";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center space-y-6 rounded-xl border bg-card p-8 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Order received</h1>
            <p className="text-muted-foreground">
              Thanks for your order{ref ? <> — reference <strong>{ref}</strong></> : ""}. We've sent
              the details to our team and someone will be in touch with you shortly to confirm your
              order and arrange payment.
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 p-4 text-left text-sm text-muted-foreground flex gap-3">
            <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Need to reach us right away? WhatsApp <strong>+27 69 838 4045</strong> or email{" "}
              <a href="mailto:hello@blank2branded.co.za" className="underline">hello@blank2branded.co.za</a>.
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
