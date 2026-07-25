import { XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/static-router";

export function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center space-y-6 rounded-xl border bg-card p-8 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-9 h-9 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Payment not completed</h1>
            <p className="text-muted-foreground">
              Your PayFast payment was cancelled or didn't go through. Your cart and proforma invoice
              are still available — you can retry payment at any time.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Need help? WhatsApp us on +27 69 838 4045 or email hello@blank2branded.co.za and reference
            your proforma number.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><Link to="/checkout">Retry payment</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/shop">Back to shop</Link></Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
