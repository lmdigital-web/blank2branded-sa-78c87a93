import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  meta_description: string | null;
};

const PAGE_SIZE = 12;

export function BlogIndexPage() {
  const path = useCurrentPath();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("posts")
      .select("id,slug,title,excerpt,cover_image_url,published_at,meta_description,status")
      .in("status", ["published", "scheduled"])
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        setPosts((data as Post[]) ?? []);
        setLoading(false);
      });
  }, [path]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Blank2Branded Blog
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-charcoal/85">
              DTF printing tips, blank apparel guides, and news from South Africa's
              go-to print &amp; press team.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading posts…</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No posts published yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-muted" />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    {p.published_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <time>{new Date(p.published_at).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</time>
                      </div>
                    )}
                    <h2 className="mt-2 text-xl font-semibold text-foreground group-hover:text-primary">
                      {p.title}
                    </h2>
                    {(p.excerpt || p.meta_description) && (
                      <p className="mt-2 line-clamp-3 text-sm text-charcoal/85">
                        {p.excerpt || p.meta_description}
                      </p>
                    )}
                    <span className="mt-4 text-sm font-medium text-primary">Read more →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
