import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, navigate, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { ArrowLeft, Truck } from "lucide-react";
import { formatZAR, ORDER_STATUS_LABELS, ORDER_STATUS_COLOURS } from "@/lib/ecom";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_amount: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  ship_line1: string; ship_line2: string | null; ship_suburb: string | null;
  ship_city: string; ship_province: string; ship_postal_code: string;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
}
interface Item {
  id: string; product_name: string; variant_label: string | null;
  sku: string | null; unit_price: number; quantity: number; line_total: number; image_url: string | null;
}
interface Event {
  id: string; event_type: string; message: string | null; created_at: string;
}

export function AccountOrderPage() {
  const { user, loading: sessionLoading } = useSession();
  const path = useCurrentPath();
  const orderNumber = path.split("/").pop()!;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) { navigate(`/login?redirect=${encodeURIComponent(path)}`); return; }
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
      if (!o) { setLoading(false); return; }
      setOrder(o as Order);
      const [{ data: it }, { data: ev }] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", o.id),
        supabase.from("order_events").select("*").eq("order_id", o.id).order("created_at", { ascending: true }),
      ]);
      setItems((it ?? []) as Item[]);
      setEvents((ev ?? []) as Event[]);
      setLoading(false);
    })();
  }, [user, sessionLoading, orderNumber, path]);

  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <div className="flex-1 flex items-center justify-center">Loading…</div>
        <Footer />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <div className="flex-1 flex items-center justify-center">Order not found.</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to account
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Order {order.order_number}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString("en-ZA")}
              </p>
            </div>
            <span className={cn("rounded px-3 py-1 text-sm font-medium", ORDER_STATUS_COLOURS[order.status])}>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {order.tracking_number && (
            <div className="mt-6 rounded-lg border bg-card p-4 flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Tracking number</p>
                <p className="font-semibold">{order.tracking_number}</p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-2 text-left">Item</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Total</th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex gap-3 items-center">
                        {i.image_url && <img src={i.image_url} alt="" className="w-12 h-12 rounded object-cover" />}
                        <div>
                          <p className="font-medium">{i.product_name}</p>
                          {i.variant_label && <p className="text-xs text-muted-foreground">{i.variant_label}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{i.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatZAR(Number(i.line_total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t"><td colSpan={2} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td><td className="px-4 py-2 text-right">{formatZAR(Number(order.subtotal))}</td></tr>
                <tr><td colSpan={2} className="px-4 py-2 text-right text-muted-foreground">Shipping</td><td className="px-4 py-2 text-right">{formatZAR(Number(order.shipping_amount))}</td></tr>
                <tr className="border-t"><td colSpan={2} className="px-4 py-2 text-right font-bold">Total</td><td className="px-4 py-2 text-right font-bold">{formatZAR(Number(order.total_amount))}</td></tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold mb-2">Shipping to</p>
              <p className="text-muted-foreground">
                {order.customer_name}<br/>
                {order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ""}<br/>
                {order.ship_suburb ? `${order.ship_suburb}, ` : ""}{order.ship_city}<br/>
                {order.ship_province} {order.ship_postal_code}<br/>
                {order.customer_phone}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold mb-2">Status history</p>
              <ul className="space-y-1 text-muted-foreground">
                {events.map((e) => (
                  <li key={e.id}>
                    <span className="text-foreground">{e.event_type}</span>
                    {e.message ? ` — ${e.message}` : ""}
                    <span className="block text-xs">{new Date(e.created_at).toLocaleString("en-ZA")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
