import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { fetchShopifyCatalog, type CatalogProduct } from "@/lib/shopify-catalog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (p: CatalogProduct) => void;
};

export function ShopifyProductPicker({ open, onOpenChange, onSelect }: Props) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchShopifyCatalog()
      .then(setProducts)
      .catch((e) => setError(e.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.handle.toLowerCase().includes(term),
    );
  }, [products, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Shopify product card</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto rounded border border-border">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No products match.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted"
                  >
                    {p.image ? (
                      <img src={p.image} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        R{Number(p.price).toFixed(2)} · /{p.handle}
                      </div>
                    </div>
                    {!p.availableForSale && (
                      <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                        Out of stock
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
