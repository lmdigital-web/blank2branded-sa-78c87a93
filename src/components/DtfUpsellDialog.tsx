import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Sparkles, Info } from "lucide-react";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyVariant, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DTF_ADDON_HANDLE = "dtf-print-add-on";
const SETUP_FEE_HANDLE = "artwork-setup-fee";

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
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [ackSetup, setAckSetup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected({});
      setAckSetup(false);
    }
  }, [open]);

  const { data: addon, isLoading: loadingAddon } = useQuery({
    queryKey: ["dtf-addon-product"],
    enabled: open,
    queryFn: async () => {
      const d = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: DTF_ADDON_HANDLE });
      return (d?.data?.productByHandle ?? null) as AddonProduct | null;
    },
  });

  const { data: setupFee } = useQuery({
    queryKey: ["setup-fee-product"],
    enabled: open,
    queryFn: async () => {
      const d = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: SETUP_FEE_HANDLE });
      return (d?.data?.productByHandle ?? null) as AddonProduct | null;
    },
  });

  const variants = useMemo(() => addon?.variants.edges.map((e) => e.node) ?? [], [addon]);
  const setupVariant = setupFee?.variants.edges[0]?.node;
  const setupAlreadyInCart = !!setupVariant && items.some((i) => i.variantId === setupVariant.id);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const printsTotal = variants.reduce(
    (sum, v) => sum + (selected[v.id] ? parseFloat(v.price.amount) * quantity : 0),
    0,
  );
  const currency = variants[0]?.price.currencyCode ?? setupVariant?.price.currencyCode ?? "ZAR";
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const setupFeeAmount = setupVariant ? parseFloat(setupVariant.price.amount) : 0;
  const addSetup = ackSetup && !setupAlreadyInCart && selectedCount > 0;
  const grandTotal = printsTotal + (addSetup ? setupFeeAmount : 0);

  const confirmDisabled =
    submitting || isLoading || selectedCount === 0 || (!setupAlreadyInCart && !ackSetup);

  const handleConfirm = async () => {
    if (!addon) return;
    const picks = variants.filter((v) => selected[v.id]);
    if (picks.length === 0) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
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

      // Add one-time setup fee (one per order — skip if already in cart).
      if (addSetup && setupFee && setupVariant) {
        const setupShell = {
          node: {
            id: setupFee.id,
            title: setupFee.title,
            description: setupFee.description,
            handle: setupFee.handle,
            priceRange: setupFee.priceRange,
            images: setupFee.images,
            variants: setupFee.variants,
            options: [{ name: "Title", values: ["Default Title"] }],
          },
        } as unknown as ShopifyProduct;

        await addItem({
          product: setupShell,
          variantId: setupVariant.id,
          variantTitle: setupVariant.title,
          price: setupVariant.price,
          quantity: 1,
          selectedOptions: setupVariant.selectedOptions ?? [],
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

            {/* Setup fee acknowledgement */}
            {selectedCount > 0 && setupVariant && (
              <div
                className={cn(
                  "mt-4 rounded-lg border p-3 text-sm transition-colors",
                  setupAlreadyInCart
                    ? "border-border bg-muted/40"
                    : ackSetup
                      ? "border-primary bg-primary/5"
                      : "border-amber-500/50 bg-amber-500/5",
                )}
              >
                {setupAlreadyInCart ? (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      One-time artwork setup fee of {currency} {setupFeeAmount.toFixed(2)} is already
                      in your cart — won't be added again.
                    </span>
                  </div>
                ) : (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                        ackSetup
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/40",
                      )}
                    >
                      {ackSetup && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={ackSetup}
                      onChange={(e) => setAckSetup(e.target.checked)}
                    />
                    <span className="text-foreground">
                      I acknowledge a one-time{" "}
                      <span className="font-bold">
                        {currency} {setupFeeAmount.toFixed(2)} artwork setup fee
                      </span>{" "}
                      per order will be added to cover artwork prep and print file setup.
                    </span>
                  </label>
                )}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  {selectedCount === 0
                    ? "No prints selected"
                    : `${selectedCount} print${selectedCount > 1 ? "s" : ""} × ${quantity} item${quantity > 1 ? "s" : ""}`}
                </span>
                <span>
                  {currency} {printsTotal.toFixed(2)}
                </span>
              </div>
              {addSetup && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Artwork setup fee (one-time)</span>
                  <span>
                    {currency} {setupFeeAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-border">
                <span className="font-semibold text-foreground">Total to add</span>
                <span className="font-bold text-foreground">
                  {currency} {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            No thanks
          </Button>
          <Button onClick={handleConfirm} disabled={confirmDisabled}>
            {submitting || isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : selectedCount === 0 ? (
              "Select a placement"
            ) : !setupAlreadyInCart && !ackSetup ? (
              "Acknowledge setup fee"
            ) : (
              `Add ${selectedCount} to cart`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
