import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { navigate } from "@/lib/static-router";
import {
  SHIPPING_AMOUNT,
  MIN_APPAREL_QTY,
  apparelQuantity,
  cartSubtotal,
  formatZAR,
} from "@/lib/ecom";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, updateQuantity, removeItem } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cartSubtotal(items);
  const appQty = apparelQuantity(items);
  const moqShort = appQty > 0 && appQty < MIN_APPAREL_QTY;
  const moqRemaining = moqShort ? MIN_APPAREL_QTY - appQty : 0;
  const total = subtotal + (items.length > 0 ? SHIPPING_AMOUNT : 0);

  const goCheckout = () => {
    if (moqShort || items.length === 0) return;
    setOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={`Open cart${totalItems > 0 ? ` (${totalItems} item${totalItems === 1 ? "" : "s"})` : ""}`}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {totalItems > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              aria-hidden="true"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0
              ? "Add products to start your order"
              : `${totalItems} item${totalItems !== 1 ? "s" : ""} — secure checkout via PayFast`}
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
                      {item.image && (
                        <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.productTitle}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.selectedOptions.map((o) => o.value).join(" • ") || item.variantTitle}
                      </p>
                      <p className="font-semibold">
                        {formatZAR(parseFloat(item.price.amount))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.variantId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline" size="icon" className="h-6 w-6"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        ><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline" size="icon" className="h-6 w-6"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        ><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t">
                {moqShort && (
                  <div className="rounded-md border border-magenta/40 bg-magenta/5 p-3 text-xs leading-relaxed text-charcoal">
                    <span className="font-semibold text-magenta">Minimum order: 3 apparel items.</span>{" "}
                    Add {moqRemaining} more to checkout. DTF prints can be ordered from 1.
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatZAR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping (nationwide)</span>
                  <span>{formatZAR(SHIPPING_AMOUNT)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatZAR(total)}</span>
                </div>
                <Button
                  onClick={goCheckout}
                  className="w-full"
                  size="lg"
                  disabled={moqShort || items.length === 0}
                >
                  Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment via PayFast — cards, Instant EFT, Snapscan and more.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
