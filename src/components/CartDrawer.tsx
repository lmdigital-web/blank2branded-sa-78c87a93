import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { trackEvent } from "@/lib/ads/pixels";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "ZAR";

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

  useEffect(() => { if (open) syncCart(); }, [open, syncCart]);

  const checkout = () => {
    if (moqShort) return;
    const url = getCheckoutUrl();
    if (url) {
      trackEvent("initiate_checkout", { value: totalPrice, currency });
      window.open(url, "_blank");
      setOpen(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
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
          ) : (
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
              <div className="space-y-4 pt-4 border-t">
                {moqShort && (
                  <div className="rounded-md border border-magenta/40 bg-magenta/5 p-3 text-xs leading-relaxed text-charcoal">
                    <span className="font-semibold text-magenta">Minimum order: 3 tees.</span>{" "}
                    Add {moqRemaining} more tee{moqRemaining === 1 ? "" : "s"} to checkout. DTF prints are exempt and can be ordered from 1.
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold">{currency} {totalPrice.toFixed(2)}</span>
                </div>
                <Button onClick={checkout} className="w-full" size="lg" disabled={isLoading || isSyncing || moqShort}>
                  {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />Checkout</>}
                </Button>
              </div>

            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
