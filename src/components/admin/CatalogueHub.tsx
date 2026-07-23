import { useState } from "react";
import { CategoriesPanel } from "./catalogue/CategoriesPanel";
import { ProductsPanel } from "./catalogue/ProductsPanel";
import { FolderTree, Package } from "lucide-react";

type Tab = "products" | "categories";

export function CatalogueHub() {
  const [tab, setTab] = useState<Tab>("products");
  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        <TabBtn active={tab === "products"} onClick={() => setTab("products")} icon={<Package className="h-3.5 w-3.5" />}>
          Products
        </TabBtn>
        <TabBtn active={tab === "categories"} onClick={() => setTab("categories")} icon={<FolderTree className="h-3.5 w-3.5" />}>
          Categories
        </TabBtn>
      </div>
      {tab === "products" && <ProductsPanel />}
      {tab === "categories" && <CategoriesPanel />}
    </div>
  );
}

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon}
      {children}
    </button>
  );
}
