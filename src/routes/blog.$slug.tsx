import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowLeft } from "lucide-react";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
};

const SITE_URL = "https://blank2branded.co.za";

function setMeta(name: string, value: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = value;
}
function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function BlogPostPage() {
  const path = useCurrentPath();
  const slug = path.replace(/^\/blog\//, "").replace(/\/$/, "");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    supabase
      .from("posts")
      .select("id,slug,title,excerpt,content,cover_image_url,published_at,meta_title,meta_description,keywords,status")
      .eq("slug", slug)
      .in("status", ["published", "scheduled"])
      .lte("published_at", new Date().toISOString())
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data as Post);
          // Record view (best-effort)
          supabase.from("post_views").insert({
            post_id: (data as Post).id,
            referrer: document.referrer || null,
          });
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const title = post.meta_title || `${post.title} | Blank2Branded Blog`;
    const desc = post.meta_description || post.excerpt || `Read ${post.title} on the Blank2Branded blog.`;
    const url = `${SITE_URL}/blog/${post.slug}`;
    document.title = title;
    setMeta("description", desc);
    if (post.keywords) setMeta("keywords", post.keywords);
    setCanonical(url);
    setMeta("og:title", title, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", "article", "property");
    if (post.cover_image_url) setMeta("og:image", post.cover_image_url, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);

    // Article JSON-LD
    const existing = document.getElementById("article-jsonld");
    if (existing) existing.remove();
    const ld = document.createElement("script");
    ld.id = "article-jsonld";
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: desc,
      image: post.cover_image_url || undefined,
      datePublished: post.published_at,
      author: { "@type": "Organization", name: "Blank2Branded" },
      publisher: {
        "@type": "Organization",
        name: "Blank2Branded",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: url,
    });
    document.head.appendChild(ld);
  }, [post]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-background">
        {loading ? (
          <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">Loading…</div>
        ) : notFound || !post ? (
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h1 className="text-3xl font-bold">Post not found</h1>
            <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to blog
            </Link>
          </div>
        ) : (
          <article className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to blog
            </Link>
            <header className="mt-6">
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {post.title}
              </h1>
              {post.published_at && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              )}
            </header>
            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="mt-8 aspect-video w-full rounded-lg object-cover"
              />
            )}
            <div
              className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
