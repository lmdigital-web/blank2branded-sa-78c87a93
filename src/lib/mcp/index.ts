import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listOrders from "./tools/list-orders";
import listBlogPosts from "./tools/list-blog-posts";
import createBlogDraft from "./tools/create-blog-draft";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "blank2branded-mcp",
  title: "Blank2Branded",
  version: "0.1.0",
  instructions:
    "Tools for the Blank2Branded store (DTF printing and blank apparel, South Africa). Use `search_products` and `get_product` for catalogue, pricing, variants and branding options; `list_orders` for recent customer orders; `list_blog_posts` and `create_blog_draft` for blog content. New posts are always created as drafts.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, getProduct, listOrders, listBlogPosts, createBlogDraft],
});
