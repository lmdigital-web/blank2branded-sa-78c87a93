import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore, type CartItem } from "@/stores/cartStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteRequestDialog({ open, onOpenChange }: Props) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const reset = () => {
    setSubmitted(false);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  const total = items.reduce(
    (s, i) => s + parseFloat(i.price.amount) * i.quantity,
    0,
  );
  const currency = items[0]?.price.currencyCode ?? "ZAR";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please add your name and email");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
        },
        message: form.message.trim() || null,
        items: items.map((i: CartItem) => ({
          productId: i.productId,
          productHandle: i.productHandle,
          productTitle: i.productTitle,
          variantId: i.variantId,
          variantTitle: i.variantTitle,
          quantity: i.quantity,
          price: i.price,
          selectedOptions: i.selectedOptions,
        })),
        totals: { amount: total.toFixed(2), currencyCode: currency },
      };

      const { error } = await supabase.functions.invoke("submit-quote-request", {
        body: payload,
      });
      if (error) throw error;

      setSubmitted(true);
      clearCart();
      toast.success("Quote request sent — we'll be in touch soon!");
    } catch (err) {
      console.error("[quote] submit failed", err);
      toast.error("Could not send. Please try again or email hello@blank2branded.co.za");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Quote request received</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks {form.name || "there"} — our team will email you a quote within one business day.
            </p>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Request a quote</DialogTitle>
              <DialogDescription>
                Tell us how to reach you. We'll email a quote for the items in your cart — no online payment required.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-name">Full name *</Label>
                <Input
                  id="qr-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qr-email">Email *</Label>
                  <Input
                    id="qr-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-phone">Phone / WhatsApp</Label>
                  <Input
                    id="qr-phone"
                    type="tel"
                    placeholder="+27..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-msg">Notes (optional)</Label>
                <Textarea
                  id="qr-msg"
                  rows={4}
                  placeholder="Anything else we should know — branding, delivery deadline, artwork, etc."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    {items.reduce((s, i) => s + i.quantity, 0)} item
                    {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "" : "s"} in your cart
                  </span>
                  <span>
                    {currency} {total.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Indicative total — final pricing confirmed in your quote.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || items.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send quote request"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
