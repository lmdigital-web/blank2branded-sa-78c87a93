import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Calendar } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

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
      <Header />
      <main className="flex-1 bg-background">
        <section className="relative overflow-hidden border-b border-border pt-40 pb-16 md:pt-48 md:pb-20">
          <div className="pointer-events-none absolute inset-0">
            <img
              src={heroBg}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-105 object-cover blur-[2px]"
            />
            <div className="absolute inset-0 bg-background/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-magenta blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-cyan blur-3xl" />
            <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-lime blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Blog</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-charcoal md:text-6xl">
              Ideas, guides &amp; <span className="text-gradient-dtf">inspiration.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-charcoal/85">
              DTF printing tips, blank apparel guides, and news from South Africa's go-to print
              &amp; press team.
            </p>
            <a
              href="#articles"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-dtf px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              <BookOpen className="h-4 w-4" />
              Explore articles
            </a>
          </div>
        </section>

        <section id="articles" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
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
                        <time>
                          {new Date(p.published_at).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
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
