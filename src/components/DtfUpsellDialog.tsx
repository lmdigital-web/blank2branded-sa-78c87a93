import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Sparkles } from "lucide-react";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyVariant, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DTF_ADDON_HANDLE = "dtf-print-add-on";

type AddonProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quantity to apply to each selected placement (matches garment qty). */
  quantity: number;
  /** Title of the apparel just added — shown in the dialog for context. */
  garmentTitle?: string;
}

export function DtfUpsellDialog({ open, onOpenChange, quantity, garmentTitle }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSelected({});
  }, [open]);

  const { data: addon, isLoading: loadingAddon } = useQuery({
    queryKey: ["dtf-addon-product"],
    enabled: open,
    queryFn: async () => {
      const d = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: DTF_ADDON_HANDLE });
      return (d?.data?.productByHandle ?? null) as AddonProduct | null;
    },
  });

  const variants = useMemo(() => addon?.variants.edges.map((e) => e.node) ?? [], [addon]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const totalAdd = variants.reduce(
    (sum, v) => sum + (selected[v.id] ? parseFloat(v.price.amount) * quantity : 0),
    0,
  );
  const currency = variants[0]?.price.currencyCode ?? "ZAR";
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleConfirm = async () => {
    if (!addon) return;
    const picks = variants.filter((v) => selected[v.id]);
    if (picks.length === 0) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      // Build a minimal ShopifyProduct shape for cart display.
      const productShell = {
        node: {
          id: addon.id,
          title: addon.title,
          description: addon.description,
          handle: addon.handle,
          priceRange: addon.priceRange,
          images: addon.images,
          variants: addon.variants,
          options: [{ name: "Placement", values: variants.map((v) => v.title) }],
        },
      } as unknown as ShopifyProduct;

      for (const v of picks) {
        await addItem({
          product: productShell,
          variantId: v.id,
          variantTitle: v.title,
          price: v.price,
          quantity,
          selectedOptions: v.selectedOptions ?? [{ name: "Placement", value: v.title }],
        });
      }
      toast.success(`Added ${picks.length} print${picks.length > 1 ? "s" : ""} to cart`);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <Sparkles className="h-5 w-5 text-primary" />
            Add DTF prints?
          </DialogTitle>
          <DialogDescription>
            {garmentTitle
              ? `Want us to print on your ${garmentTitle}? Pick any placements below — pricing is per print, per item.`
              : "Want us to add prints? Pick any placements below — pricing is per print, per item."}
          </DialogDescription>
        </DialogHeader>

        {loadingAddon ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !addon || variants.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Print add-ons are unavailable right now.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {variants.map((v) => {
                const isOn = !!selected[v.id];
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggle(v.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-all",
                      isOn
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2",
                          isOn ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                      >
                        {isOn && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{v.title}</p>
                        <p className="text-xs text-muted-foreground">Per print</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {v.price.currencyCode} {parseFloat(v.price.amount).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {selectedCount === 0
                    ? "No prints selected"
                    : `${selectedCount} print${selectedCount > 1 ? "s" : ""} × ${quantity} item${quantity > 1 ? "s" : ""}`}
                </span>
                <span className="font-bold text-foreground">
                  {currency} {totalAdd.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            No thanks
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || isLoading || selectedCount === 0}
          >
            {submitting || isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : selectedCount === 0 ? (
              "Select a placement"
            ) : (
              `Add ${selectedCount} to cart`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
