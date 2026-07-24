import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, MessageCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useCartStore } from "@/stores/cartStore";
import { trackEvent } from "@/lib/ads/pixels";
import { buildOrderMessage, openWhatsApp, SHIPPING_FEE, type WhatsAppCustomer } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const customerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Surname is required").max(60),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid contact number")
    .max(20)
    .regex(/^[0-9+\s()-]+$/, "Only digits, spaces and + - ( ) allowed"),
  email: z.string().trim().email("Enter a valid email").max(160),
  address: z.string().trim().min(10, "Enter your full delivery address").max(400),
});

const EMPTY_CUSTOMER: WhatsAppCustomer = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
};

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "details">("cart");
  const [customer, setCustomer] = useState<WhatsAppCustomer>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<Partial<Record<keyof WhatsAppCustomer, string>>>({});
  const [sending, setSending] = useState(false);
  const { items, updateQuantity, removeItem } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "ZAR";
  const total = subtotal + (items.length > 0 ? SHIPPING_FEE : 0);

  // MOQ: tees/blanks require a minimum of 3. DTF prints, add-ons, and setup fees are exempt.
  const isExempt = (handle?: string, title?: string) => {
    const h = (handle ?? "").toLowerCase();
    const t = (title ?? "").toLowerCase();
    if (h.startsWith("dtf-") || h.includes("dtf")) return true;
    if (h.includes("setup") || h.includes("add-on") || h.includes("addon") || h.includes("fee")) return true;
    if (t.includes("dtf") || t.includes("setup fee") || t.includes("add-on") || t.includes("add on")) return true;
    return false;
  };
  const teeQty = items
    .filter((i) => {
      const node = i.product.node as { handle?: string; title?: string };
      return !isExempt(node.handle, node.title);
    })
    .reduce((s, i) => s + i.quantity, 0);
  const moqShort = teeQty > 0 && teeQty < 3;
  const moqRemaining = moqShort ? 3 - teeQty : 0;

  const updateField = (key: keyof WhatsAppCustomer, value: string) => {
    setCustomer((c) => ({ ...c, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const sendOrder = async () => {
    if (moqShort || items.length === 0 || sending) return;
    const parsed = customerSchema.safeParse(customer);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof WhatsAppCustomer, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof WhatsAppCustomer;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSending(true);
    trackEvent("initiate_checkout", { value: total, currency });

    const lineItems = items.map((i) => {
      const node = i.product.node as { title?: string; handle?: string };
      const opts = i.selectedOptions?.map((o) => o.value).filter(Boolean).join(" / ");
      return {
        title: node.title ?? i.variantTitle,
        selectedOptions: i.selectedOptions,
        quantity: i.quantity,
        price: i.price,
        handle: node.handle,
        _invoice: {
          name: node.title ?? i.variantTitle,
          description: opts ?? "",
          quantity: i.quantity,
          rate: parseFloat(i.price.amount),
        },
      };
    });

    let invoiceNumber: string | undefined;
    try {
      const { data, error } = await supabase.functions.invoke("zoho-create-invoice", {
        body: {
          customer: parsed.data,
          items: lineItems.map((l) => l._invoice),
          shipping: SHIPPING_FEE,
          currency,
        },
      });
      if (error) throw error;
      invoiceNumber = data?.invoice_number;
      toast.success(
        invoiceNumber
          ? `Invoice ${invoiceNumber} emailed to ${parsed.data.email}`
          : "Invoice sent to your email",
      );
    } catch (err) {
      console.error("Zoho invoice failed:", err);
      toast.error("We couldn't create the invoice automatically — we'll send it manually on WhatsApp.");
    }

    // Fire-and-forget order confirmation email (customer + owner)
    supabase.functions
      .invoke("send-order-notification", {
        body: {
          customer: parsed.data,
          items: lineItems.map((l) => l._invoice),
          shipping: SHIPPING_FEE,
          currency,
          invoiceNumber,
        },
      })
      .catch((err) => console.error("Order email failed:", err));

    // Kick off PayFast checkout (redirect current window to PayFast)
    const paymentId = `B2B-${Date.now()}`;
    try {
      const { data: pf, error: pfErr } = await supabase.functions.invoke("payfast-create-payment", {
        body: {
          customer: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            email: parsed.data.email,
            phone: parsed.data.phone,
          },
          amount: total,
          itemName: invoiceNumber ? `Order ${invoiceNumber}` : "Blank2Branded Order",
          itemDescription: lineItems.map((l) => `${l._invoice.quantity}x ${l._invoice.name}`).join(", ").slice(0, 250),
          invoiceNumber,
          paymentId,
        },
      });
      if (pfErr) throw pfErr;

      // Open WhatsApp with the order summary (new tab) so we still receive it.
      const msg = buildOrderMessage(lineItems, parsed.data);
      openWhatsApp(msg);

      // Auto-submit a form to PayFast to redirect the buyer.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = pf.process_url;
      Object.entries(pf.fields as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      return;
    } catch (err) {
      console.error("PayFast redirect failed:", err);
      toast.error("Couldn't open PayFast — we'll take payment via the emailed invoice instead.");
    }

    setSending(false);
    const msg = buildOrderMessage(lineItems, parsed.data);
    openWhatsApp(msg);
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setStep("cart");
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Open cart${totalItems > 0 ? ` (${totalItems} item${totalItems !== 1 ? "s" : ""})` : ""}`}>
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs" aria-hidden="true">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>{step === "cart" ? "Your Order" : "Your details"}</SheetTitle>
          <SheetDescription>
            {step === "details"
              ? "We'll use these details to confirm your quote and delivery."
              : totalItems === 0
                ? "No items yet — add products to send us a quote."
                : `${totalItems} item${totalItems !== 1 ? "s" : ""} — send on WhatsApp to get a quote.`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : step === "cart" ? (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {item.product.node.images?.edges?.[0]?.node && (
                        <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.product.node.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.selectedOptions.map((o) => o.value).join(" • ")}</p>
                      <p className="font-semibold">{item.price.currencyCode} {parseFloat(item.price.amount).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.variantId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t">
                {moqShort && (
                  <div className="rounded-md border border-magenta/40 bg-magenta/5 p-3 text-xs leading-relaxed text-charcoal">
                    <span className="font-semibold text-magenta">Minimum order: 3 tees.</span>{" "}
                    Add {moqRemaining} more tee{moqRemaining === 1 ? "" : "s"} to send. DTF prints are exempt and can be ordered from 1.
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{currency} {SHIPPING_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-semibold">Estimated total</span>
                    <span className="text-lg font-bold">{currency} {total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setStep("details")}
                  className="w-full"
                  size="lg"
                  disabled={moqShort}
                >
                  Continue to details
                </Button>
                <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
                  We'll reply with a final quote, artwork check and payment details. No card is charged on this site.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cust-first">First name</Label>
                    <Input
                      id="cust-first"
                      value={customer.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      autoComplete="given-name"
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cust-last">Surname</Label>
                    <Input
                      id="cust-last"
                      value={customer.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      autoComplete="family-name"
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cust-phone">Contact number</Label>
                  <Input
                    id="cust-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="e.g. 082 123 4567"
                    value={customer.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cust-email">Email</Label>
                  <Input
                    id="cust-email"
                    type="email"
                    inputMode="email"
                    value={customer.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cust-address">Physical delivery address</Label>
                  <Textarea
                    id="cust-address"
                    rows={3}
                    placeholder="Street, suburb, city, postal code"
                    value={customer.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    autoComplete="street-address"
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{currency} {SHIPPING_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-semibold">Estimated total</span>
                    <span className="text-lg font-bold">{currency} {total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("cart")} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={sendOrder}
                    className="flex-[2]"
                    size="lg"
                    disabled={moqShort || sending}
                  >
                    {sending ? "Preparing payment…" : "Pay securely with PayFast"}
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
                  We'll email your invoice, send the order to us on WhatsApp, and redirect you to PayFast to pay securely.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
