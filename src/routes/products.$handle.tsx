import { Link, useProductHandle } from "@/lib/static-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { ShopifyVariant } from "@/lib/shopify";
import { getProductByHandle, listPublishedProducts } from "@/lib/catalog";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ArrowLeft, Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DtfUpsellDialog } from "@/components/DtfUpsellDialog";
import { productSchema, breadcrumbSchema, injectJsonLd, removeJsonLd, SITE_URL } from "@/lib/schema-builder";
import { supabase } from "@/integrations/supabase/client";

type BrandingOption = {
  id: string;
  branding_type: string;
  position: string;
  branding_size: string | null;
  max_colour_count: number | null;
  unit_cost: number;
  setup_fee: number;
};

const DTF_ADDON_HANDLE = "dtf-print-add-on";
// Products that are themselves prints — no upsell popup needed.
const NO_UPSELL_HANDLES = new Set([
  DTF_ADDON_HANDLE,
  "dtf-print-a4",
  "dtf-print-a5",
  "dtf-print-a6",
  "dtf-print-1-meter-20cm-wide",
]);

// Map of print product handles to their Shopify Gangio builder URL.
// Customers can either Add to Cart directly or jump into the gang-sheet builder.
const GANG_BUILDER_URLS: Record<string, string> = {
  "dtf-print-1-meter-20cm-wide":
    "https://blank2branded.myshopify.com/apps/gang-sheet-builder/builder?product_id=8527307505825&variant_id=46470926237857",
  "dtf-print-a4":
    "https://blank2branded.myshopify.com/apps/gang-sheet-builder/builder?product_id=8527297052833&variant_id=46470915391649",
};

const RECENT_KEY = "recently-viewed-products";

// (recently viewed pulls the full published-product list from Supabase)



const COLOR_MAP: Record<string, string> = {
  black: "#000000", white: "#ffffff", navy: "#1e2a4a", "navy blue": "#1e2a4a",
  blue: "#1d4ed8", royal: "#1d4ed8", "royal blue": "#1d4ed8",
  "light blue": "#7dd3fc", "sky blue": "#7dd3fc", sky: "#7dd3fc",
  grey: "#9ca3af", gray: "#9ca3af", "light grey": "#d1d5db", "light gray": "#d1d5db",
  "dark grey": "#4b5563", "dark gray": "#4b5563", charcoal: "#374151",
  green: "#15803d", "forest green": "#14532d", forest: "#14532d",
  lime: "#84cc16", "lime green": "#84cc16",
  red: "#dc2626", orange: "#f97316", yellow: "#facc15",
  pink: "#ec4899", purple: "#7c3aed", brown: "#78350f", beige: "#e7d4b5",
  cream: "#f5f0e1", maroon: "#7f1d1d", burgundy: "#7f1d1d",
};

function colorToHex(value: string): string {
  const key = value.toLowerCase().trim();
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  return key;
}

export function ProductPage() {
  const handle = useProductHandle();
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [quantity, setQuantity] = useState(1);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [lastAddedQty, setLastAddedQty] = useState(1);

  const { data: product, isLoading: loading } = useQuery({
    queryKey: ["catalog-product", handle],
    queryFn: async () => {
      const shaped = await getProductByHandle(handle);
      if (!shaped) return null;
      // Adapt to the shape this page has always used.
      return {
        id: shaped.node.id,
        title: shaped.node.title,
        description: shaped.node.description,
        descriptionHtml: shaped.node.descriptionHtml,
        handle: shaped.node.handle,
        images: shaped.node.images,
        variants: shaped.node.variants,
        options: shaped.node.options,
      };
    },
  });

  // Track recently viewed in localStorage
  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const prev: string[] = raw ? JSON.parse(raw) : [];
      const next = [product.handle, ...prev.filter((h) => h !== product.handle)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }, [product]);

  const { data: brandingOptions = [] } = useQuery({
    queryKey: ["product-branding", product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_product_branding_options")
        .select("id,branding_type,position,branding_size,max_colour_count,unit_cost,setup_fee")
        .eq("product_id", product!.id)
        .order("branding_type")
        .order("position");
      if (error) throw error;
      return (data ?? []) as BrandingOption[];
    },
  });
  const hasBranding = brandingOptions.length > 0;

  const variants = product?.variants.edges.map((e) => e.node) ?? [];
  const options = product?.options ?? [];

  // Inject Product + BreadcrumbList JSON-LD whenever product/variant changes.
  useEffect(() => {
    if (!product) return;
    const firstAvail = variants.find((v) => v.availableForSale) ?? variants[0];
    const price = firstAvail?.price;
    injectJsonLd(
      "product-jsonld",
      productSchema({
        title: product.title,
        description: (product.description || "").slice(0, 5000),
        handle: product.handle,
        image: product.images.edges[0]?.node.url,
        price: price?.amount,
        currency: price?.currencyCode || "ZAR",
        availability: firstAvail?.availableForSale ? "InStock" : "OutOfStock",
        sku: firstAvail?.id?.split("/").pop() || null,
        brand: "Blank2Branded",
      }),
    );
    injectJsonLd(
      "breadcrumb-jsonld",
      breadcrumbSchema([
        { name: "Home", url: `${SITE_URL}/` },
        { name: "Shop", url: `${SITE_URL}/shop/` },
        { name: product.title, url: `${SITE_URL}/products/${product.handle}/` },
      ]),
    );
    return () => {
      removeJsonLd("product-jsonld");
      removeJsonLd("breadcrumb-jsonld");
    };
  }, [product, variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [brandType, setBrandType] = useState<string>("");
  const [brandPosition, setBrandPosition] = useState<string>("");
  const [brandSize, setBrandSize] = useState<string>("");
  const [brandColours, setBrandColours] = useState<string>("");
  const [colourCount, setColourCount] = useState<number>(1);
  const cartItems = useCartStore((s) => s.items);

  // Cascading branding selectors
  const brandTypes = useMemo(
    () => Array.from(new Set(brandingOptions.map((b) => b.branding_type))).sort(),
    [brandingOptions],
  );
  const brandPositions = useMemo(
    () =>
      Array.from(
        new Set(
          brandingOptions
            .filter((b) => !brandType || b.branding_type === brandType)
            .map((b) => b.position),
        ),
      ).sort(),
    [brandingOptions, brandType],
  );
  const brandSizes = useMemo(
    () =>
      Array.from(
        new Set(
          brandingOptions
            .filter(
              (b) =>
                (!brandType || b.branding_type === brandType) &&
                (!brandPosition || b.position === brandPosition),
            )
            .map((b) => b.branding_size || ""),
        ),
      ),
    [brandingOptions, brandType, brandPosition],
  );
  const brandColourOpts = useMemo(
    () =>
      Array.from(
        new Set(
          brandingOptions
            .filter(
              (b) =>
                (!brandType || b.branding_type === brandType) &&
                (!brandPosition || b.position === brandPosition) &&
                (!brandSize || (b.branding_size || "") === brandSize),
            )
            .map((b) => (b.max_colour_count == null ? "" : String(b.max_colour_count))),
        ),
      ),
    [brandingOptions, brandType, brandPosition, brandSize],
  );

  // Reset downstream selections when an upstream selection changes
  useEffect(() => {
    setBrandPosition("");
    setBrandSize("");
    setBrandColours("");
    setColourCount(1);
  }, [brandType]);
  useEffect(() => {
    setBrandSize("");
    setBrandColours("");
    setColourCount(1);
  }, [brandPosition]);
  useEffect(() => {
    setBrandColours("");
    setColourCount(1);
  }, [brandSize]);

  const matchedBranding = useMemo(() => {
    if (!brandType) return null;
    const matches = brandingOptions.filter(
      (b) =>
        b.branding_type === brandType &&
        (!brandPosition || b.position === brandPosition) &&
        (!brandSize || (b.branding_size || "") === brandSize) &&
        (!brandColours || String(b.max_colour_count ?? "") === brandColours),
    );
    return matches.length === 1 ? matches[0] : null;
  }, [brandingOptions, brandType, brandPosition, brandSize, brandColours]);
  const selectedBrandingId = matchedBranding?.id ?? null;

  const initialSelected = useMemo(() => {
    if (variants.length === 0) return {};
    const first = variants.find((v) => v.availableForSale) ?? variants[0];
    return Object.fromEntries(first.selectedOptions.map((o) => [o.name, o.value]));
  }, [variants]);

  const currentSelections = { ...initialSelected, ...selectedOptions };

  const selectedVariant = useMemo(
    () => variants.find((v) => v.selectedOptions.every((o) => currentSelections[o.name] === o.value)) ?? variants[0],
    [variants, currentSelections]
  );

  const isOptionAvailable = (optionName: string, value: string) => {
    return variants.some(
      (v) => v.availableForSale && v.selectedOptions.every((o) =>
        o.name === optionName ? o.value === value : currentSelections[o.name] === o.value
      )
    );
  };

  const selectOption = (name: string, value: string) => {
    setSelectedOptions((s) => ({ ...s, [name]: value }));
  };

  const handleAdd = async () => {
    if (!product || !selectedVariant) return;
    try {
      await addItem({
        product: { node: { ...product, priceRange: { minVariantPrice: selectedVariant.price } } as never },
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        quantity,
        selectedOptions: selectedVariant.selectedOptions ?? [],
      });

      // If a branding option is selected, add branding-per-unit line + one-time setup fee.
      const chosenBranding = brandingOptions.find((b) => b.id === selectedBrandingId);
      if (chosenBranding) {
        const currency = selectedVariant.price.currencyCode || "ZAR";
        const perColour = (chosenBranding.max_colour_count ?? 1) > 1;
        const colours = perColour ? colourCount : 1;
        const effectiveUnit = Number(chosenBranding.unit_cost) * colours;
        const colourSuffix = perColour ? ` · ${colours} colour${colours === 1 ? "" : "s"}` : "";
        const brandingLabel = `${chosenBranding.branding_type} — ${chosenBranding.position}${chosenBranding.branding_size ? ` (${chosenBranding.branding_size})` : ""}${colourSuffix}`;
        const brandingVariantId = `branding:${chosenBranding.id}:${colours}`;
        const brandingProductShell = {
          node: {
            id: `branding-product:${chosenBranding.id}:${colours}`,
            title: `Branding — ${product.title}`,
            description: brandingLabel,
            handle: `${product.handle}-branding`,
            priceRange: { minVariantPrice: { amount: String(effectiveUnit), currencyCode: currency } },
            images: product.images,
            variants: { edges: [] },
            options: [{ name: "Branding", values: [brandingLabel] }],
          },
        } as never;
        await addItem({
          product: brandingProductShell,
          variantId: brandingVariantId,
          variantTitle: brandingLabel,
          price: { amount: String(effectiveUnit), currencyCode: currency },
          quantity,
          selectedOptions: [{ name: "Branding", value: brandingLabel }],
        });

        const setupVariantId = `branding-setup:${chosenBranding.id}`;
        const alreadyHasSetup = cartItems.some((i) => i.variantId === setupVariantId);
        if (!alreadyHasSetup && Number(chosenBranding.setup_fee) > 0) {
          const setupShell = {
            node: {
              id: `branding-setup-product:${chosenBranding.id}`,
              title: `Artwork setup — ${chosenBranding.branding_type}`,
              description: "One-time setup fee",
              handle: `${product.handle}-branding-setup`,
              priceRange: { minVariantPrice: { amount: String(chosenBranding.setup_fee), currencyCode: currency } },
              images: product.images,
              variants: { edges: [] },
              options: [{ name: "Fee", values: ["Setup"] }],
            },
          } as never;
          await addItem({
            product: setupShell,
            variantId: setupVariantId,
            variantTitle: `Setup — ${chosenBranding.branding_type}`,
            price: { amount: String(chosenBranding.setup_fee), currencyCode: currency },
            quantity: 1,
            selectedOptions: [{ name: "Fee", value: "One-time setup" }],
          });
        }
      }

      toast.success(chosenBranding ? "Added with branding to cart" : "Added to cart");
    } catch (err) {
      console.error("[cart] addItem failed", err);
      toast.error("Could not add to cart");
    }
    // Offer DTF prints — but not for print products themselves, and not for
    // products that have their own per-product branding options (e.g. pens,
    // bags) where the DTF placements (right chest, A3, etc.) don't apply.
    if (!NO_UPSELL_HANDLES.has(product.handle) && !hasBranding) {
      console.log("[upsell] opening DTF dialog for qty", quantity);
      setLastAddedQty(quantity);
      setUpsellOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !product ? (
            <p>Product not found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-xl overflow-hidden">
                {product.images.edges[0] && (
                  <img src={product.images.edges[0].node.url} alt={product.images.edges[0].node.altText ?? product.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">{product.title}</h1>
                {selectedVariant && (
                  <p className="mt-3 text-2xl font-bold text-primary">
                    {selectedVariant.price.currencyCode} {parseFloat(selectedVariant.price.amount).toFixed(2)}
                  </p>
                )}
                {product.descriptionHtml ? (
                  <div
                    className="prose prose-sm dark:prose-invert mt-6 max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                  />
                ) : (
                  <p className="mt-6 text-muted-foreground whitespace-pre-line">{product.description}</p>
                )}

                <div className="mt-8 space-y-6">
                  {options.map((opt) => {
                    const isColor = /colou?r/i.test(opt.name);
                    return (
                      <div key={opt.name}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-bold uppercase tracking-widest text-foreground">{opt.name}</span>
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">{currentSelections[opt.name]}</span>
                        </div>
                        {isColor ? (
                          <div className="flex flex-wrap gap-2.5">
                            {opt.values.map((value) => {
                              const selected = currentSelections[opt.name] === value;
                              const available = isOptionAvailable(opt.name, value);
                              const hex = colorToHex(value);
                              const isLight = ["#ffffff", "#f5f0e1", "#e7d4b5", "#d1d5db", "#facc15", "#84cc16", "#7dd3fc"].includes(hex);
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => selectOption(opt.name, value)}
                                  disabled={!available}
                                  title={value + (available ? "" : " (unavailable)")}
                                  className={cn(
                                    "relative h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center",
                                    selected ? "border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background scale-110" : "border-border hover:border-foreground/40",
                                    !available && "opacity-40 cursor-not-allowed"
                                  )}
                                  style={{ backgroundColor: hex }}
                                >
                                  {selected && <Check className={cn("h-4 w-4", isLight ? "text-black" : "text-white")} strokeWidth={3} />}
                                  {!available && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <span className="h-[2px] w-12 bg-foreground/50 rotate-45" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {opt.values.map((value) => {
                              const selected = currentSelections[opt.name] === value;
                              const available = isOptionAvailable(opt.name, value);
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => selectOption(opt.name, value)}
                                  disabled={!available}
                                  className={cn(
                                    "min-w-[3.25rem] h-10 px-4 rounded-md border text-sm font-semibold transition-all",
                                    selected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-background text-foreground hover:border-foreground/40",
                                    !available && "opacity-40 cursor-not-allowed line-through"
                                  )}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-stretch gap-3">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-12 w-12 flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="h-12 w-12 flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    onClick={handleAdd}
                    size="lg"
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={isLoading || !selectedVariant?.availableForSale}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedVariant?.availableForSale ? (
                      <><ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart</>
                    ) : (
                      "Sold out"
                    )}
                  </Button>
                </div>

                {hasBranding && (
                  <div className="mt-6 rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Branding options</p>
                      {brandType && (
                        <button
                          type="button"
                          onClick={() => setBrandType("")}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Optional — pick a branding method to add it to your cart. Unit cost is per item, plus a one-time setup fee per order.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {/* Method */}
                      <label className="block text-xs">
                        <span className="mb-1 block font-medium text-muted-foreground">Method</span>
                        <select
                          value={brandType}
                          onChange={(e) => setBrandType(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select method…</option>
                          {brandTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </label>

                      {/* Position */}
                      {brandType && brandPositions.length > 0 && (
                        <label className="block text-xs">
                          <span className="mb-1 block font-medium text-muted-foreground">Position</span>
                          <select
                            value={brandPosition}
                            onChange={(e) => setBrandPosition(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select position…</option>
                            {brandPositions.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </label>
                      )}

                      {/* Size */}
                      {brandType && brandPosition && brandSizes.length > 0 && (brandSizes.length > 1 || brandSizes[0] !== "") && (
                        <label className="block text-xs">
                          <span className="mb-1 block font-medium text-muted-foreground">Size</span>
                          <select
                            value={brandSize}
                            onChange={(e) => setBrandSize(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select size…</option>
                            {brandSizes.map((s) => (
                              <option key={s || "none"} value={s}>{s || "Standard"}</option>
                            ))}
                          </select>
                        </label>
                      )}

                      {/* Number of colours (per-colour pricing) */}
                      {matchedBranding && (matchedBranding.max_colour_count ?? 1) > 1 && (
                        <label className="block text-xs">
                          <span className="mb-1 block font-medium text-muted-foreground">
                            Number of colours{" "}
                            <span className="opacity-70">(up to {matchedBranding.max_colour_count})</span>
                          </span>
                          <select
                            value={colourCount}
                            onChange={(e) => setColourCount(Number(e.target.value))}
                            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {Array.from({ length: matchedBranding.max_colour_count ?? 1 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n} colour{n === 1 ? "" : "s"}</option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>

                    {matchedBranding && (() => {
                      const b = matchedBranding;
                      const perColour = (b.max_colour_count ?? 1) > 1;
                      const colours = perColour ? colourCount : 1;
                      const unit = Number(b.unit_cost) * colours;
                      const setup = Number(b.setup_fee);
                      const brandingTotal = unit * quantity + setup;
                      return (
                        <div className="mt-3 flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
                          <span className="text-foreground">
                            <span className="font-semibold">{b.branding_type} — {b.position}{b.branding_size ? ` (${b.branding_size})` : ""}{perColour ? ` · ${colours} colour${colours === 1 ? "" : "s"}` : ""}</span>
                            <span className="text-muted-foreground"> · R {unit.toFixed(2)} × {quantity} + R {setup.toFixed(2)} setup</span>
                          </span>
                          <span className="font-bold text-foreground tabular-nums">+ R {brandingTotal.toFixed(2)}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}


                {product && GANG_BUILDER_URLS[product.handle] && (
                  <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Need to fit multiple designs on one sheet?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use our Gang Sheet Builder to arrange your artwork on a 20 cm wide roll before checkout.
                    </p>
                    <a
                      href={GANG_BUILDER_URLS[product.handle]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:scale-[1.02]"
                    >
                      Build Gang Sheet →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      {product && <RecentlyViewed currentHandle={product.handle} />}
      <Footer />
      <DtfUpsellDialog
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        quantity={lastAddedQty}
        garmentTitle={product?.title}
      />
    </div>
  );
}

function RecentlyViewed({ currentHandle }: { currentHandle: string }) {
  const [handles, setHandles] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const prev: string[] = raw ? JSON.parse(raw) : [];
      setHandles(prev.filter((h) => h !== currentHandle).slice(0, 4));
    } catch { /* ignore */ }
  }, [currentHandle]);

  const { data: products } = useQuery({
    queryKey: ["recently-viewed", handles],
    enabled: handles.length > 0,
    queryFn: async () => {
      const all = await listPublishedProducts();
      const byHandle = new Map(all.map((p) => [p.node.handle, p]));
      return handles
        .map((h) => byHandle.get(h))
        .filter(Boolean)
        .map((p) => ({
          id: p!.node.id,
          handle: p!.node.handle,
          title: p!.node.title,
          images: p!.node.images,
          priceRange: p!.node.priceRange,
        }));
    },
  });

  if (!products || products.length === 0) return null;

  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-black tracking-tight mb-8">Recently Viewed</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p.id}
              to="/products/$handle"
              params={{ handle: p.handle }}
              className="group block"
            >
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {p.images.edges[0] && (
                  <img
                    src={p.images.edges[0].node.url}
                    alt={p.images.edges[0].node.altText ?? p.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
              <p className="mt-1 text-sm font-bold text-primary">
                {p.priceRange.minVariantPrice.currencyCode} {parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

