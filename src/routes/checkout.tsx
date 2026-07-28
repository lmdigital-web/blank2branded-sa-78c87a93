import { useMemo, useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, ShieldCheck, Truck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ads/pixels";
import { SHIPPING_FEE } from "@/lib/whatsapp";
import { Link, navigate } from "@/lib/static-router";

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
  street: z.string().trim().min(3, "Street address is required").max(160),
  suburb: z.string().trim().min(2, "Suburb is required").max(80),
  city: z.string().trim().min(2, "City is required").max(80),
  province: z.string().trim().min(2, "Province is required").max(60),
  postalCode: z
    .string()
    .trim()
    .min(4, "Enter a valid postal code")
    .max(10)
    .regex(/^[0-9]+$/, "Postal code must be digits only"),
  notes: z.string().trim().max(500).optional(),
});

type CustomerForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
};

const EMPTY: CustomerForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  street: "",
  suburb: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
};

export function CheckoutPage() {
  const { items } = useCartStore();
  const [customer, setCustomer] = useState<typeof EMPTY>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});
  const [ackLeadTime, setAckLeadTime] = useState(false);
  const [ackError, setAckError] = useState(false);
  const [sending, setSending] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0),
    [items],
  );
  const currency = items[0]?.price.currencyCode ?? "ZAR";
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  const updateField = (key: keyof typeof EMPTY, value: string) => {
    setCustomer((c) => ({ ...c, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const placeOrder = async () => {
    if (items.length === 0 || sending) return;
    if (!ackLeadTime) {
      setAckError(true);
      toast.error("Please acknowledge the 7–14 working day lead time to continue.");
      return;
    }
    const parsed = customerSchema.safeParse(customer);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof typeof EMPTY, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof typeof EMPTY;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setSending(true);
    trackEvent("initiate_checkout", { value: total, currency });

    const { notes, street, suburb, city, province, postalCode, ...rest } = parsed.data;
    const address = `${street}, ${suburb}, ${city}, ${province}, ${postalCode}`;
    const orderRef = `B2B-${Date.now()}`;
    const lineItems = items.map((i) => {
      const node = i.product.node as { title?: string };
      const opts = i.selectedOptions?.map((o) => o.value).filter(Boolean).join(" / ");
      return {
        name: node.title ?? i.variantTitle,
        description: opts ?? "",
        quantity: i.quantity,
        rate: parseFloat(i.price.amount),
      };
    });

    try {
      const { error } = await supabase.functions.invoke("send-order-notification", {
        body: {
          customer: { ...rest, address },
          items: lineItems,
          shipping: SHIPPING_FEE,
          currency,
          invoiceNumber: orderRef,
          notes,
        },
      });
      if (error) throw error;
      trackEvent("purchase", { value: total, currency, reference: orderRef });
      navigate(`/checkout/success/?ref=${encodeURIComponent(orderRef)}`);
    } catch (err) {
      console.error("Order submission failed:", err);
      toast.error("Couldn't submit your order — please try again or WhatsApp us on +27 69 838 4045.");
      setSending(false);
    }
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header variant="solid" />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-3xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Add DTF transfers or blank apparel to your cart, then come back to check out.
            </p>
            <Button asChild size="lg">
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <button
            onClick={() => navigate("/shop/")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Continue shopping
          </button>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground mb-8">
            Enter your details below and place your order — we'll be in touch shortly to confirm and arrange payment.
          </p>

          <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
            {/* Left: form */}
            <div className="space-y-8">
              <section aria-labelledby="contact-heading" className="space-y-4">
                <div>
                  <h2 id="contact-heading" className="text-lg font-semibold">
                    Contact details
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    We'll email your invoice and order confirmation here.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={customer.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      autoComplete="given-name"
                      aria-invalid={!!errors.firstName}
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Surname</Label>
                    <Input
                      id="lastName"
                      value={customer.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      autoComplete="family-name"
                      aria-invalid={!!errors.lastName}
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      value={customer.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Contact number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="e.g. 082 123 4567"
                      value={customer.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      autoComplete="tel"
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>
              </section>

              <Separator />

              <section aria-labelledby="delivery-heading" className="space-y-4">
                <div>
                  <h2 id="delivery-heading" className="text-lg font-semibold">
                    Delivery address
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Courier nationwide across South Africa. Flat R{SHIPPING_FEE.toFixed(2)} shipping.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="street">Street address</Label>
                  <Input
                    id="street"
                    placeholder="e.g. 12 Main Road"
                    value={customer.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    autoComplete="address-line1"
                    aria-invalid={!!errors.street}
                  />
                  {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input
                      id="suburb"
                      placeholder="e.g. Sonheuwel"
                      value={customer.suburb}
                      onChange={(e) => updateField("suburb", e.target.value)}
                      autoComplete="address-level2"
                      aria-invalid={!!errors.suburb}
                    />
                    {errors.suburb && <p className="text-xs text-destructive">{errors.suburb}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Mbombela"
                      value={customer.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      autoComplete="address-level2"
                      aria-invalid={!!errors.city}
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      placeholder="e.g. Mpumalanga"
                      value={customer.province}
                      onChange={(e) => updateField("province", e.target.value)}
                      autoComplete="address-level1"
                      aria-invalid={!!errors.province}
                    />
                    {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input
                      id="postalCode"
                      inputMode="numeric"
                      placeholder="e.g. 1200"
                      value={customer.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value)}
                      autoComplete="postal-code"
                      aria-invalid={!!errors.postalCode}
                    />
                    {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                  </div>
                </div>
              </section>

              <Separator />

              <section aria-labelledby="notes-heading" className="space-y-4">
                <div>
                  <h2 id="notes-heading" className="text-lg font-semibold">
                    Order notes <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Artwork instructions, brand colours, deadline — anything we should know.
                  </p>
                </div>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="e.g. Please gang my A4 prints tightly. Deadline 25 Nov."
                  value={customer.notes ?? ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </section>

              <div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure order</div>
                <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Nationwide courier</div>
              </div>
            </div>

            {/* Right: order summary */}
            <aside className="lg:sticky lg:top-24 self-start">
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-semibold">Order summary</h2>

                <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const img = item.product.node.images?.edges?.[0]?.node;
                    const opts = item.selectedOptions.map((o) => o.value).filter(Boolean).join(" • ");
                    const lineTotal = parseFloat(item.price.amount) * item.quantity;
                    return (
                      <li key={item.variantId} className="flex gap-3">
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          {img && (
                            <img
                              src={img.url}
                              alt={item.product.node.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-sm">
                          <p className="font-medium truncate">{item.product.node.title}</p>
                          {opts && <p className="text-xs text-muted-foreground truncate">{opts}</p>}
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {currency} {lineTotal.toFixed(2)}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{currency} {shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-2xl font-bold">{currency} {total.toFixed(2)}</span>
                  </div>
                </div>

                <div
                  className={`rounded-md border p-3 space-y-2 ${
                    ackError && !ackLeadTime
                      ? "border-destructive bg-destructive/5"
                      : "border-amber-500/50 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-start gap-2 text-xs text-charcoal">
                    <Clock className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                    <p className="leading-relaxed">
                      <span className="font-bold uppercase">Please note:</span>{" "}
                      <span className="font-bold">
                        Any order that requires artwork or printing has a lead time of 7–14 working days
                      </span>{" "}
                      from the date artwork is approved and payment is received. Blank stock only orders
                      ship within 1–3 working days.
                    </p>
                  </div>
                  <label
                    htmlFor="ack-lead-time"
                    className="flex items-start gap-2 text-xs font-semibold text-charcoal cursor-pointer pt-1"
                  >
                    <Checkbox
                      id="ack-lead-time"
                      checked={ackLeadTime}
                      onCheckedChange={(v) => {
                        setAckLeadTime(v === true);
                        if (v === true) setAckError(false);
                      }}
                      className="mt-0.5"
                    />
                    <span>I acknowledge and accept the 7–14 working day lead time for printed orders.</span>
                  </label>
                  {ackError && !ackLeadTime && (
                    <p className="text-[11px] text-destructive pl-6">
                      You must acknowledge the lead time before making payment.
                    </p>
                  )}
                </div>

                <Button
                  onClick={placeOrder}
                  disabled={sending || !ackLeadTime}
                  size="lg"
                  className="w-full"
                >
                  {sending ? "Placing order…" : `Place order · ${currency} ${total.toFixed(2)}`}
                </Button>


                <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
                  By placing your order you agree to our{" "}
                  <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
                  <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>

                <div className="flex lg:hidden items-center justify-center gap-4 text-[11px] text-muted-foreground pt-1">
                  <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</div>
                  <div className="flex items-center gap-1"><Truck className="w-3 h-3" /> Courier</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
