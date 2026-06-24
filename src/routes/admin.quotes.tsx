import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Inbox, Mail, Phone, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


interface QuoteItem {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
}

interface QuoteRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string | null;
  status: "new" | "quoted" | "closed";
  items: QuoteItem[];
  item_count: number;
  estimated_total: number | null;
  currency_code: string;
  notes: string | null;
  created_at: string;
}

const STATUS_FILTERS: Array<{ label: string; value: "all" | "new" | "quoted" | "closed" }> = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Quoted", value: "quoted" },
  { label: "Closed", value: "closed" },
];

export function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "quoted" | "closed">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void load();
  }, []);


  async function load() {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setQuotes((data as unknown as QuoteRequest[]) ?? []);
    }
    setLoadingData(false);
  }

  async function setStatus(id: string, status: QuoteRequest["status"]) {
    const { error } = await supabase
      .from("quote_requests")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Marked ${status}`);
      void load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this quote request?")) return;
    const { error } = await supabase.from("quote_requests").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      void load();
    }
  }

  const visible = quotes.filter((q) => (filter === "all" ? true : q.status === filter));
  const newCount = quotes.filter((q) => q.status === "new").length;

  return (
    <AdminLayout title="Quote Requests">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Inbox className="h-6 w-6" /> Quote Requests
          </h1>

              <p className="text-sm text-muted-foreground">
                {newCount} new · {quotes.length} total
              </p>
            </div>
            <div className="inline-flex rounded-md border border-border bg-card p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-medium transition",
                    filter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loadingData ? (
              <div className="py-12 text-center text-muted-foreground">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                No quote requests yet.
              </div>
            ) : (
              visible.map((q) => {
                const open = !!expanded[q.id];
                return (
                  <div key={q.id} className="rounded-lg border border-border bg-card">
                    <button
                      onClick={() => setExpanded((s) => ({ ...s, [q.id]: !open }))}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {open ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            q.status === "new" && "bg-amber-100 text-amber-800",
                            q.status === "quoted" && "bg-blue-100 text-blue-800",
                            q.status === "closed" && "bg-green-100 text-green-800",
                          )}
                        >
                          {q.status}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{q.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {q.customer_email} · {q.item_count} item{q.item_count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">
                          {q.currency_code} {(q.estimated_total ?? 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(q.created_at).toLocaleString("en-ZA")}
                        </p>
                      </div>
                    </button>

                    {open && (
                      <div className="space-y-4 border-t border-border p-4">
                        <div className="flex flex-wrap gap-3 text-sm">
                          <a
                            href={`mailto:${q.customer_email}`}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Mail className="h-4 w-4" /> {q.customer_email}
                          </a>
                          {q.customer_phone && (
                            <a
                              href={`https://wa.me/${q.customer_phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Phone className="h-4 w-4" /> {q.customer_phone}
                            </a>
                          )}
                        </div>

                        {q.message && (
                          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                            {q.message}
                          </div>
                        )}

                        <div className="overflow-hidden rounded-md border border-border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-left">Product</th>
                                <th className="px-3 py-2 text-center">Qty</th>
                                <th className="px-3 py-2 text-right">Unit</th>
                                <th className="px-3 py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {q.items.map((i, idx) => {
                                const opts =
                                  i.selectedOptions?.map((o) => `${o.name}: ${o.value}`).join(", ") ||
                                  i.variantTitle;
                                const lineTotal =
                                  parseFloat(i.price.amount) * i.quantity;
                                return (
                                  <tr key={idx} className="border-t border-border">
                                    <td className="px-3 py-2">
                                      <p className="font-medium">{i.productTitle}</p>
                                      <p className="text-xs text-muted-foreground">{opts}</p>
                                    </td>
                                    <td className="px-3 py-2 text-center">{i.quantity}</td>
                                    <td className="px-3 py-2 text-right">
                                      {i.price.currencyCode} {parseFloat(i.price.amount).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">
                                      {i.price.currencyCode} {lineTotal.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                          <div className="flex flex-wrap gap-2">
                            {q.status !== "quoted" && (
                              <Button size="sm" onClick={() => setStatus(q.id, "quoted")}>
                                Mark as quoted
                              </Button>
                            )}
                            {q.status !== "closed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStatus(q.id, "closed")}
                              >
                                Close
                              </Button>
                            )}
                            {q.status !== "new" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setStatus(q.id, "new")}
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => remove(q.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
