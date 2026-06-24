import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useCurrentPath } from "@/lib/static-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { formatZAR, ORDER_STATUS_LABELS, ORDER_STATUS_COLOURS } from "@/lib/ecom";
import { cn } from "@/lib/utils";

interface Order {
  id: string; order_number: string; status: string;
  customer_name: string; customer_email: string; customer_phone: string | null;
  subtotal: number; shipping_amount: number; total_amount: number;
  ship_line1: string; ship_line2: string | null; ship_suburb: string | null;
  ship_city: string; ship_province: string; ship_postal_code: string;
  tracking_number: string | null; internal_notes: string | null;
  created_at: string; paid_at: string | null;
  payfast_payment_id: string | null;
}
interface Item {
  id: string; product_name: string; variant_label: string | null;
  sku: string | null; unit_price: number; quantity: number; line_total: number; image_url: string | null;
}
interface Event {
  id: string; event_type: string; message: string | null; created_at: string;
}

const STATUSES = ["pending_payment", "paid", "in_production", "shipped", "delivered", "cancelled", "refunded"];

export function AdminOrderDetailPage() {
  const path = useCurrentPath();
  const orderNumber = path.split("/").pop()!;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, [orderNumber]);

  async function load() {
    const { data: o } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
    if (!o) return;
    setOrder(o as Order);
    setStatus(o.status);
    setTracking(o.tracking_number ?? "");
    setNotes(o.internal_notes ?? "");
    const [{ data: it }, { data: ev }] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", o.id),
      supabase.from("order_events").select("*").eq("order_id", o.id).order("created_at", { ascending: true }),
    ]);
    setItems((it ?? []) as Item[]);
    setEvents((ev ?? []) as Event[]);
  }

  async function save() {
    if (!order) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("update-order-status", {
        body: {
          order_id: order.id,
          status: status !== order.status ? status : undefined,
          tracking_number: tracking !== (order.tracking_number ?? "") ? tracking : undefined,
          internal_notes: notes !== (order.internal_notes ?? "") ? notes : undefined,
        },
      });
      if (error) throw error;
      toast.success("Order updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!order) return <AdminLayout title="Order"><div className="p-12 text-center text-muted-foreground">Loading…</div></AdminLayout>;

  return (
    <AdminLayout title={`Order ${order.order_number}`}>
      <Link to="/admin/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("en-ZA")}</p>
        </div>
        <span className={cn("rounded px-3 py-1 text-sm font-medium", ORDER_STATUS_COLOURS[order.status])}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-2 text-left">Item</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Unit</th><th className="px-4 py-2 text-right">Total</th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i.image_url && <img src={i.image_url} alt="" className="w-10 h-10 rounded object-cover" />}
                        <div>
                          <p className="font-medium">{i.product_name}</p>
                          {i.variant_label && <p className="text-xs text-muted-foreground">{i.variant_label}</p>}
                          {i.sku && <p className="text-xs text-muted-foreground">SKU: {i.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{i.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatZAR(Number(i.unit_price))}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatZAR(Number(i.line_total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t"><td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td><td className="px-4 py-2 text-right">{formatZAR(Number(order.subtotal))}</td></tr>
                <tr><td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Shipping</td><td className="px-4 py-2 text-right">{formatZAR(Number(order.shipping_amount))}</td></tr>
                <tr className="border-t"><td colSpan={3} className="px-4 py-2 text-right font-bold">Total</td><td className="px-4 py-2 text-right font-bold">{formatZAR(Number(order.total_amount))}</td></tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3">Status history</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {events.map((e) => (
                <li key={e.id}>
                  <span className="text-foreground">{e.event_type}</span>
                  {e.message ? ` — ${e.message}` : ""} <span className="text-xs">· {new Date(e.created_at).toLocaleString("en-ZA")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-semibold mb-2">Customer</p>
            <p>{order.customer_name}</p>
            <p className="text-muted-foreground">{order.customer_email}</p>
            {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
          </div>
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-semibold mb-2">Shipping address</p>
            <p className="text-muted-foreground">
              {order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ""}<br/>
              {order.ship_suburb ? `${order.ship_suburb}, ` : ""}{order.ship_city}<br/>
              {order.ship_province} {order.ship_postal_code}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="font-semibold">Update order</p>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tracking">Tracking number</Label>
              <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Courier tracking #" />
            </div>
            <div>
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Setting status to <strong>Shipped</strong> emails the customer with the tracking number.
            </p>
            {order.payfast_payment_id && (
              <p className="text-xs text-muted-foreground border-t pt-2">PayFast ID: {order.payfast_payment_id}</p>
            )}
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
