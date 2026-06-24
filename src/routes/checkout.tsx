import { useEffect, useState, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useCartStore } from "@/stores/cartStore";
import { navigate, Link } from "@/lib/static-router";
import {
  SHIPPING_AMOUNT, MIN_APPAREL_QTY, ZA_PROVINCES,
  apparelQuantity, cartSubtotal, formatZAR,
} from "@/lib/ecom";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";

interface SavedAddress {
  id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  suburb: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const EMPTY = {
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  suburb: "",
  city: "",
  province: "Gauteng",
  postal_code: "",
};

export function CheckoutPage() {
  const { user, loading: sessionLoading } = useSession();
  const { items } = useCartStore();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string>("new");
  const [form, setForm] = useState({ ...EMPTY });
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cartSubtotal(items);
  const appQty = apparelQuantity(items);
  const moqShort = appQty > 0 && appQty < MIN_APPAREL_QTY;
  const total = subtotal + SHIPPING_AMOUNT;

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      navigate("/login?redirect=/checkout");
      return;
    }
    supabase
      .from("customer_addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) return;
        const list = (data ?? []) as SavedAddress[];
        setAddresses(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          applyAddress(list[0]);
        }
      });
  }, [user, sessionLoading]);

  function applyAddress(a: SavedAddress) {
    setForm({
      recipient_name: a.recipient_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      suburb: a.suburb ?? "",
      city: a.city,
      province: a.province,
      postal_code: a.postal_code,
    });
  }

  function onSelectAddress(id: string) {
    setSelectedId(id);
    if (id === "new") setForm({ ...EMPTY });
    else {
      const a = addresses.find((x) => x.id === id);
      if (a) applyAddress(a);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (moqShort) { toast.error(`Minimum ${MIN_APPAREL_QTY} apparel items required.`); return; }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payfast-checkout", {
        body: {
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          shipping: {
            recipient_name: form.recipient_name.trim(),
            phone: form.phone.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || null,
            suburb: form.suburb.trim() || null,
            city: form.city.trim(),
            province: form.province,
            postal_code: form.postal_code.trim(),
            country: "South Africa",
          },
          save_address: selectedId === "new" && saveAddress,
          address_label: addressLabel,
        },
      });
      if (error) throw error;
      const url = (data as { redirect_url?: string })?.redirect_url;
      if (!url) throw new Error("No checkout URL returned");
      window.location.assign(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start checkout";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <div className="flex-1 flex items-center justify-center">Loading…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="mt-1 text-muted-foreground">
            Secure payment via PayFast. Flat R120 nationwide courier.
          </p>

          {items.length === 0 ? (
            <div className="mt-10 rounded-lg border border-dashed bg-card p-12 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Link to="/shop" className="mt-4 inline-block text-primary underline">Continue shopping</Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold">Shipping address</h2>

                  {addresses.length > 0 && (
                    <div className="mt-4">
                      <Label>Use a saved address</Label>
                      <Select value={selectedId} onValueChange={onSelectAddress}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {addresses.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.label ?? a.recipient_name} — {a.line1}, {a.city}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">+ Use a new address</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="recipient_name">Full name *</Label>
                      <Input id="recipient_name" required value={form.recipient_name}
                        onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" required value={form.phone} placeholder="082 123 4567"
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postal code *</Label>
                      <Input id="postal_code" required value={form.postal_code}
                        onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="line1">Address line 1 *</Label>
                      <Input id="line1" required value={form.line1}
                        onChange={(e) => setForm({ ...form, line1: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="line2">Address line 2 (optional)</Label>
                      <Input id="line2" value={form.line2}
                        onChange={(e) => setForm({ ...form, line2: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input id="suburb" value={form.suburb}
                        onChange={(e) => setForm({ ...form, suburb: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" required value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Province *</Label>
                      <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ZA_PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedId === "new" && (
                    <div className="mt-4 flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                      <Checkbox id="save" checked={saveAddress} onCheckedChange={(v) => setSaveAddress(!!v)} />
                      <Label htmlFor="save" className="font-normal cursor-pointer">
                        Save this address for next time
                      </Label>
                      {saveAddress && (
                        <Input
                          className="ml-auto max-w-[160px]"
                          placeholder="Label (Home/Work)"
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold">Payment</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You'll be redirected to PayFast's secure checkout to complete your payment with
                    card, Instant EFT, Snapscan or other supported methods.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" /> 256-bit encrypted · PCI-DSS compliant
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border bg-card p-6 lg:sticky lg:top-24">
                  <h2 className="text-lg font-semibold">Order summary</h2>
                  <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {items.map((i) => (
                      <div key={i.variantId} className="flex gap-3 text-sm">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                          {i.image && <img src={i.image} alt={i.productTitle} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{i.productTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {i.selectedOptions.map((o) => o.value).join(" • ") || i.variantTitle} × {i.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium whitespace-nowrap">
                          {formatZAR(parseFloat(i.price.amount) * i.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatZAR(subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatZAR(SHIPPING_AMOUNT)}</span></div>
                    <div className="flex justify-between border-t pt-2 text-base font-semibold">
                      <span>Total</span><span>{formatZAR(total)}</span>
                    </div>
                  </div>
                  {moqShort && (
                    <p className="mt-3 rounded-md border border-magenta/40 bg-magenta/5 p-2 text-xs text-magenta">
                      Add {MIN_APPAREL_QTY - appQty} more apparel item(s) to checkout.
                    </p>
                  )}
                  <Button type="submit" className="mt-4 w-full" size="lg" disabled={submitting || moqShort}>
                    {submitting ? "Redirecting…" : (<><Lock className="w-4 h-4 mr-2" /> Pay {formatZAR(total)}</>)}
                  </Button>
                </div>
              </aside>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
