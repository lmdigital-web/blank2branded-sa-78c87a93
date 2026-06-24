import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { useSession } from "@/lib/auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatZAR } from "@/lib/ecom";

export function CheckoutSuccessPage() {
  const path = useCurrentPath();
  const { clearCart } = useCartStore();
  const { user, loading: sessionLoading } = useSession();
  const [order, setOrder] = useState<{ order_number: string; status: string; total_amount: number } | null>(null);
  const [polling, setPolling] = useState(true);

  const orderNumber = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("order");

  useEffect(() => {
    if (sessionLoading || !user || !orderNumber) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      const { data } = await supabase
        .from("orders")
        .select("order_number, status, total_amount")
        .eq("order_number", orderNumber!)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setOrder({
          order_number: data.order_number,
          status: data.status,
          total_amount: Number(data.total_amount),
        });
        if (data.status === "paid") {
          clearCart();
          setPolling(false);
          return;
        }
      }
      attempts++;
      if (attempts < 10) setTimeout(poll, 2000);
      else setPolling(false);
    }
    void poll();
    return () => { cancelled = true; };
  }, [user, sessionLoading, orderNumber, clearCart, path]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-lg rounded-lg border bg-card p-8 text-center shadow-sm">
          {polling && order?.status !== "paid" ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="mt-4 text-2xl font-bold">Confirming your payment…</h1>
              <p className="mt-2 text-muted-foreground">
                This usually takes a few seconds. Don't close this page.
              </p>
            </>
          ) : order?.status === "paid" ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="mt-4 text-2xl font-bold">Payment received!</h1>
              <p className="mt-2 text-muted-foreground">
                Thanks for your order. We've emailed your confirmation.
              </p>
              <div className="mt-6 rounded-md border bg-muted/40 p-4 text-left text-sm">
                <p><span className="text-muted-foreground">Order:</span> <strong>{order.order_number}</strong></p>
                <p><span className="text-muted-foreground">Total:</span> <strong>{formatZAR(order.total_amount)}</strong></p>
              </div>
              <div className="mt-6 flex gap-2 justify-center">
                <Button asChild><Link to="/account">View my orders</Link></Button>
                <Button variant="outline" asChild><Link to="/shop">Continue shopping</Link></Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Order received</h1>
              <p className="mt-2 text-muted-foreground">
                We haven't received confirmation from PayFast yet. Your order will update automatically — check{" "}
                <Link to="/account" className="text-primary underline">My account</Link> shortly.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function CheckoutCancelledPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-lg rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Payment cancelled</h1>
          <p className="mt-2 text-muted-foreground">
            No payment was taken. Your cart is still saved.
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button asChild><Link to="/checkout">Try again</Link></Button>
            <Button variant="outline" asChild><Link to="/shop">Back to shop</Link></Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
