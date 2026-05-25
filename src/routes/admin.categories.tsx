import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function AdminCategories() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data: cats } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name) });
    if (error) { toast.error(error.message); return; }
    setName("");
    toast.success("Category added");
    qc.invalidateQueries({ queryKey: ["categories-admin"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["categories-admin"] });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Categories</h1>
      <form onSubmit={add} className="mt-8 flex items-end gap-3 max-w-md">
        <div className="flex-1">
          <Label htmlFor="name">New category</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DTF Tips" />
        </div>
        <Button type="submit">Add</Button>
      </form>
      <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden max-w-2xl">
        {!cats || cats.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No categories yet.</p>
        ) : cats.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-border last:border-0 p-4">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => del(c.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
