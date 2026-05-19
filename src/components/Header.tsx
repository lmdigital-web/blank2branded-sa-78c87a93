import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        scrolled
          ? "sticky border-b border-border bg-background/95 backdrop-blur shadow-sm"
          : "absolute border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <Link to="/" className="flex items-center" aria-label="Blank2Branded home">
          <img
            src={logo}
            alt="Blank2Branded — DTF, Blanks, Print & Press"
            className={`w-auto transition-all duration-300 ${
              scrolled ? "h-14 md:h-16" : "h-24 md:h-40"
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
          <Link to="/blanks" className={linkCls} activeProps={{ className: "text-primary" }}>
            Blanks
          </Link>
          <Link to="/contact" className={linkCls} activeProps={{ className: "text-primary" }}>
            Contact
          </Link>
          <Link
            to="/contact"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Get Quote
          </Link>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
            <Link to="/" className={linkCls} onClick={() => setOpen(false)}>Home</Link>
            <Link to="/about" className={linkCls} onClick={() => setOpen(false)}>About</Link>
            <Link to="/blanks" className={linkCls} onClick={() => setOpen(false)}>Blanks</Link>
            <Link to="/contact" className={linkCls} onClick={() => setOpen(false)}>Contact</Link>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Get Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
