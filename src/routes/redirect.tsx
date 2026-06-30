import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  try {
    let id = localStorage.getItem("b2b_sid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("b2b_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Handles /r/blog/:postId/:productHandle — logs a click then redirects. */
export function BlogRedirectPage() {
  useEffect(() => {
    const match = window.location.pathname.match(/^\/r\/blog\/([^/]+)\/([^/]+)$/);
    if (!match) {
      window.location.replace("/");
      return;
    }
    const postId = decodeURIComponent(match[1]);
    const handle = decodeURIComponent(match[2]);
    const target = `/products/${handle}?ref=blog-${postId}`;

    // Fire-and-forget click log; never block the redirect
    void supabase
      .from("blog_clicks")
      .insert({
        post_id: postId,
        product_handle: handle,
        ref_code: `blog-${postId}`,
        session_id: getSessionId(),
        user_agent: navigator.userAgent.slice(0, 255),
      })
      .then(() => {
        /* noop */
      });

    // Redirect after a microtask so the insert request fires
    setTimeout(() => window.location.replace(target), 50);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
