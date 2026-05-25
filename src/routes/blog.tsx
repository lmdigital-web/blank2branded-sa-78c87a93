import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Blank2Branded" },
      { name: "description", content: "News, guides and stories from the Blank2Branded workshop." },
      { property: "og:title", content: "Blog — Blank2Branded" },
      { property: "og:description", content: "News, guides and stories from Blank2Branded." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, cover_image_url, published_at, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Blog</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">News & guides.</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Tips on DTF printing, blanks, and building your brand.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-24">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No posts yet</h2>
              <p className="mt-2 text-muted-foreground">Check back soon for new articles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
                >
                  {p.cover_image_url ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-magenta/20" />
                  )}
                  <div className="p-6">
                    {p.categories && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{(p.categories as { name: string }).name}</p>
                    )}
                    <h2 className="mt-2 text-xl font-bold line-clamp-2">{p.title}</h2>
                    {p.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
                    {p.published_at && (
                      <p className="mt-4 text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
