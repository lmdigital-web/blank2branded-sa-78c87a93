import { useEffect, useState } from "react";
import { fetchProductByHandle, type CatalogProduct } from "@/lib/shopify-catalog";

type Props = { handle: string; postId?: string | null };

export function ShopifyProductCard({ handle, postId }: Props) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchProductByHandle(handle)
      .then((p) => {
        if (!alive) return;
        if (!p) setMissing(true);
        else setProduct(p);
      })
      .catch(() => alive && setMissing(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [handle]);

  if (loading) {
    return (
      <div className="my-6 flex animate-pulse gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="h-24 w-24 rounded bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  // Gracefully hide if product was deleted
  if (missing || !product) return null;

  const href = postId
    ? `/r/blog/${postId}/${product.handle}`
    : `/products/${product.handle}`;
  const oos = !product.availableForSale;

  return (
    <a
      href={href}
      className="my-6 not-prose flex items-center gap-4 rounded-lg border border-border bg-card p-4 no-underline transition hover:border-primary hover:shadow-md"
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="h-24 w-24 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-24 w-24 shrink-0 rounded bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{product.title}</h3>
          {oos && (
            <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              Out of stock
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            R{Number(product.price).toFixed(2)}
          </span>
          <span className="text-sm font-medium text-primary">
            {oos ? "View product →" : "Shop now →"}
          </span>
        </div>
      </div>
    </a>
  );
}
