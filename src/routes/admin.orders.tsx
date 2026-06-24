import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@/lib/static-router";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatZAR, ORDER_STATUS_LABELS, ORDER_STATUS_COLOURS } from "@/lib/ecom";

interface Order {
  id: string; order_number: string; status: string;
  customer_name: string; customer_email: string;
  total_amount: number; created_at: string;
}

const FILTERS: Array<{ label: string; value: string | "all" }> = [
  { label: "All", value: "all" },
  { label: "Awaiting payment", value: "pending_payment" },
  { label: "Paid", value: "paid" },
  { label: "In production", value: "in_production" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, customer_name, customer_email, total_amount, created_at")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (q && !`${o.order_number} ${o.customer_name} ${o.customer_email}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShoppingBag className="h-6 w-6" /> Orders
        </h1>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search order # or customer…"
          className="rounded-md border px-3 py-1.5 text-sm w-64 bg-card"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1 rounded-md border bg-card p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn("rounded px-3 py-1 text-xs font-medium", filter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-lg border bg-card">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No orders.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2 text-left">Order</th><th className="px-4 py-2 text-left">Customer</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Date</th></tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3"><Link to={`/admin/orders/${o.order_number}`} className="font-semibold text-primary hover:underline">{o.order_number}</Link></td>
                  <td className="px-4 py-3"><p>{o.customer_name}</p><p className="text-xs text-muted-foreground">{o.customer_email}</p></td>
                  <td className="px-4 py-3 text-center"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", ORDER_STATUS_COLOURS[o.status])}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatZAR(Number(o.total_amount))}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-ZA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
