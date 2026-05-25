import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyVariant } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/products/$handle")({
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const { data: product, isLoading: loading } = useQuery({
    queryKey: ["shopify-product", handle],
    queryFn: async () => {
      const d = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      const p = d?.data?.productByHandle;
      if (!p) throw notFound();
      return p as {
        id: string; title: string; description: string; handle: string;
        images: { edges: Array<{ node: { url: string; altText: string | null } }> };
        variants: { edges: Array<{ node: ShopifyVariant }> };
        options: Array<{ name: string; values: string[] }>;
      };
    },
  });

  const variants = product?.variants.edges.map((e) => e.node) ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const selectedVariant = useMemo(() => variants.find((v) => v.id === variantId) ?? variants[0], [variants, variantId]);

  const handleAdd = async () => {
    if (!product || !selectedVariant) return;
    await addItem({
      product: { node: { ...product, priceRange: { minVariantPrice: selectedVariant.price } } as never },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions ?? [],
    });
    toast.success("Added to cart");
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
                <p className="mt-6 text-muted-foreground whitespace-pre-line">{product.description}</p>

                {variants.length > 1 && (
                  <div className="mt-6">
                    <label className="text-sm font-semibold">Variant</label>
                    <select
                      value={selectedVariant?.id ?? ""}
                      onChange={(e) => setVariantId(e.target.value)}
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={!v.availableForSale}>
                          {v.title} {!v.availableForSale && "(sold out)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  onClick={handleAdd}
                  size="lg"
                  className="mt-8 w-full"
                  disabled={isLoading || !selectedVariant?.availableForSale}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedVariant?.availableForSale ? "Add to Cart" : "Sold out"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
