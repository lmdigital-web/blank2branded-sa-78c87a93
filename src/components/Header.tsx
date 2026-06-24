import { Link } from "@/lib/static-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.webp";
import logoSm from "@/assets/logo-sm.webp";

import { CartDrawer } from "@/components/CartDrawer";

type HeaderProps = {
  variant?: "overlay" | "solid";
};

export function Header({ variant = "overlay" }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const solid = variant === "solid" || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls =
    "text-sm font-medium text-charcoal hover:text-primary transition-colors";

  return (
    <header
      className={`top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? "sticky border-b border-border bg-background/95 backdrop-blur shadow-sm"
          : "absolute border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
          solid ? "py-2" : "py-4"
        }`}
      >
        <Link to="/" className="flex items-center" aria-label="Blank2Branded home">
          <img
            src={logoSm}
            srcSet={`${logoSm} 320w, ${logo} 480w`}
            sizes="(max-width: 768px) 144px, 240px"
            width={480}
            height={319}
            alt="Blank2Branded — DTF, Blanks, Print & Press"
            fetchPriority="high"
            decoding="async"
            className={`w-auto transition-all duration-300 ${
              solid ? "h-14 md:h-16" : "h-24 md:h-40"
            }`}
          />

        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className={linkCls} activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
            Home
          </Link>
          <Link to="/about" className={linkCls} activeProps={{ className: "text-primary" }}>
            About
          </Link>
          <Link to="/dtf" className={linkCls} activeProps={{ className: "text-primary" }}>
            DTF Prints
          </Link>
          <Link to="/blanks" className={linkCls} activeProps={{ className: "text-primary" }}>
            Blanks
          </Link>
          <Link to="/blog" className={linkCls} activeProps={{ className: "text-primary" }}>
            Blog
          </Link>
          <Link to="/contact" className={linkCls} activeProps={{ className: "text-primary" }}>
            Contact
          </Link>
          <Link
            to="/shop"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Shop Now
          </Link>
          <CartDrawer />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-charcoal hover:bg-charcoal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
            <Link to="/" className={linkCls} onClick={() => setOpen(false)}>Home</Link>
            <Link to="/about" className={linkCls} onClick={() => setOpen(false)}>About</Link>
            <Link to="/dtf" className={linkCls} onClick={() => setOpen(false)}>DTF Prints</Link>
            <Link to="/blanks" className={linkCls} onClick={() => setOpen(false)}>Blanks</Link>
            <Link to="/blog" className={linkCls} onClick={() => setOpen(false)}>Blog</Link>
            
            <Link to="/contact" className={linkCls} onClick={() => setOpen(false)}>Contact</Link>
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Shop Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
