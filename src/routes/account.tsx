import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, navigate } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Package, MapPin, LogOut } from "lucide-react";
import { formatZAR, ORDER_STATUS_LABELS, ORDER_STATUS_COLOURS } from "@/lib/ecom";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface AddressRow {
  id: string;
  label: string | null;
  recipient_name: string;
  line1: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
}

export function AccountPage() {
  const { user, loading: sessionLoading } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) { navigate("/login?redirect=/account"); return; }
    (async () => {
      const [{ data: o }, { data: a }] = await Promise.all([
        supabase.from("orders")
          .select("id, order_number, status, total_amount, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("customer_addresses").select("*").order("is_default", { ascending: false }),
      ]);
      setOrders((o ?? []) as OrderRow[]);
      setAddresses((a ?? []) as AddressRow[]);
      setLoading(false);
    })();
  }, [user, sessionLoading]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (sessionLoading || loading) {
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
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My account</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
          </div>

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Package className="h-5 w-5" /> Orders
            </h2>
            <div className="mt-3 rounded-lg border bg-card">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No orders yet. <Link to="/shop" className="text-primary underline">Start shopping</Link>
                </div>
              ) : (
                <ul className="divide-y">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        to={`/account/orders/${o.order_number}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString("en-ZA", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </p>
                        </div>
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", ORDER_STATUS_COLOURS[o.status])}>
                          {ORDER_STATUS_LABELS[o.status] ?? o.status}
                        </span>
                        <span className="font-semibold">{formatZAR(Number(o.total_amount))}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <MapPin className="h-5 w-5" /> Addresses
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {addresses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No saved addresses yet — add one at checkout.</p>
              ) : addresses.map((a) => (
                <div key={a.id} className="rounded-lg border bg-card p-4 text-sm">
                  <p className="font-semibold">{a.label ?? "Address"}{a.is_default && <span className="ml-2 text-xs text-muted-foreground">(default)</span>}</p>
                  <p className="mt-1 text-muted-foreground">
                    {a.recipient_name}<br/>
                    {a.line1}<br/>
                    {a.city}, {a.province} {a.postal_code}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
