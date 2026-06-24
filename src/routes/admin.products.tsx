import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, navigate } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminProduct {
  id: string;
  handle: string;
  title: string;
  status: "draft" | "published";
  base_price: number | null;
  currency_code: string;
  category_id: string | null;
  shop_categories: { name: string } | null;
  shop_product_variants: Array<{ id: string }>;
  shop_product_images: Array<{ id: string }>;
}

export function AdminProductsPage() {
  const { isAdmin, loading, user } = useIsAdmin();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isAdmin) return;
    void load();
  }, [loading, user, isAdmin]);

  async function load() {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("shop_products")
      .select(
        "id,handle,title,status,base_price,currency_code,category_id," +
          "shop_categories(name),shop_product_variants(id),shop_product_images(id)",
      )
      .order("title", { ascending: true });
    if (error) toast.error(error.message);
    else setProducts((data as unknown as AdminProduct[]) ?? []);
    setLoadingData(false);
  }

  async function toggleStatus(p: AdminProduct) {
    const next = p.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("shop_products")
      .update({ status: next })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Marked ${next}`);
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    }
  }

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.title}"? This also removes variants and images.`)) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted");
      setProducts((list) => list.filter((x) => x.id !== p.id));
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access denied</h1>
            <p className="mt-2 text-muted-foreground">You don't have admin permissions.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const published = products.filter((p) => p.status === "published").length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            to="/admin"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to admin
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Package className="h-7 w-7" /> Products
              </h1>
              <p className="text-sm text-muted-foreground">
                {published} published · {products.length} total
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Variants</th>
                  <th className="px-4 py-3 text-right">Base price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">/{p.handle}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {p.shop_categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {p.shop_product_variants?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {p.currency_code} {(p.base_price ?? 0).toString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(p)}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            p.status === "published"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200",
                          )}
                          title="Click to toggle"
                        >
                          {p.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {p.status === "published" && (
                            <Link to={`/products/${p.handle}`} target="_blank">
                              <Button size="sm" variant="ghost" title="View">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete"
                            onClick={() => remove(p)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Tip: toggle status to control visibility on the storefront. Customer quote requests
            arrive in <Link to="/admin/quotes" className="text-primary hover:underline">Quote Requests</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
