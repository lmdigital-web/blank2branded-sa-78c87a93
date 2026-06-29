import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useCurrentPath, navigate } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  status: string;
};

export function PostPreviewPage() {
  const path = useCurrentPath();
  const id = path.replace(/^\/admin\/preview\//, "").replace(/\/$/, "");
  const { isAdmin, loading, user } = useIsAdmin();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) return;
    supabase
      .from("posts")
      .select("id,slug,title,excerpt,content,cover_image_url,published_at,status")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setPost((data as Post) || null);
        setLoadingPost(false);
      });
  }, [loading, user, isAdmin, id]);

  if (loading || loadingPost) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center">Access denied</div>;
  }
  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <main className="mx-auto max-w-3xl flex-1 px-6 py-24 text-center">
          <h1 className="text-3xl font-bold">Post not found</h1>
          <Link to="/admin" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to admin
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <Eye className="h-4 w-4" /> Preview mode — status: <span className="capitalize">{post.status}</span> (not visible to the public until published)
          </span>
          <div className="flex gap-3">
            <Link to={`/admin/posts/${post.id}`} className="underline">Edit</Link>
            <Link to="/admin" className="underline">Back to admin</Link>
          </div>
        </div>
      </div>
      <Header variant="solid" />
      <main className="flex-1 bg-background">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <header>
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
      </main>
      <Footer />
    </div>
  );
}
