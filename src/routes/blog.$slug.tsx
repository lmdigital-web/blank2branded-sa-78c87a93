import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Track a view once per post per page load
  useEffect(() => {
    if (!post?.id) return;
    const key = `viewed:${post.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase
      .from("post_views")
      .insert({ post_id: post.id, referrer: document.referrer || null })
      .then(() => {});
  }, [post?.id]);

  // Inject per-post SEO meta tags client-side
  useEffect(() => {
    if (!post) return;
    const title = post.meta_title || post.title;
    const desc = post.meta_description || post.excerpt || "";
    if (title) document.title = title;
    setMeta("description", desc);
    setMeta("keywords", (post as { keywords?: string }).keywords ?? "");
    setMetaProp("og:title", title);
    setMetaProp("og:description", desc);
    setMetaProp("og:type", "article");
    if (post.cover_image_url) setMetaProp("og:image", post.cover_image_url);
  }, [post]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="pt-32 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !post ? (
            <p className="py-12 text-muted-foreground">Post not found.</p>
          ) : (
            <>
              {post.categories && (
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{(post.categories as { name: string }).name}</p>
              )}
              <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">{post.title}</h1>
              {post.published_at && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title} className="mt-8 w-full rounded-xl" />
              )}
              <div className="prose prose-lg mt-8 max-w-none whitespace-pre-wrap text-foreground">
                {post.content}
              </div>
            </>
          )}
        </div>
      </article>
      <Footer />
    </div>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}
function setMetaProp(prop: string, content: string) {
  let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", prop);
    document.head.appendChild(el);
  }
  el.content = content;
}
