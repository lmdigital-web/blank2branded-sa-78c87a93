import { Link } from "@/lib/static-router";
import { Instagram, Facebook, Mail } from "lucide-react";
import logo from "@/assets/logo.webp";

export function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal text-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <img src={logo} width={480} height={319} loading="lazy" decoding="async" alt="Blank2Branded" className="h-16 w-auto rounded bg-background/5 p-2" />
            <p className="mt-4 max-w-sm text-sm text-background/60">
              From Blank to Branded. Nationwide. Supplier of DTF transfers
              & blank apparel for South African brands, businesses and individuals. Minimum 5 pieces per order.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://www.instagram.com/blank2brandedza" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded border border-background/20 p-2 hover:border-primary hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.facebook.com/blank2brandedza" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded border border-background/20 p-2 hover:border-primary hover:text-primary">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.tiktok.com/@blank2brandedza" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="rounded border border-background/20 p-2 hover:border-primary hover:text-primary">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.94a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z"/></svg>
              </a>
              <a href="mailto:hello@blank2branded.co.za" aria-label="Email" className="rounded border border-background/20 p-2 hover:border-primary hover:text-primary">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background">Navigate</h4>
            <ul className="mt-4 space-y-2 text-sm text-background/60">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/blanks" className="hover:text-primary">Blanks</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/shop" className="hover:text-primary">Shop Now</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-background/60">
              <li>hello@blank2branded.co.za</li>
              <li>Mon–Fri 8am–4pm</li>
              <li>Mbombela, South Africa</li>
              <li>Courier nationwide</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/10 pt-6 text-xs text-background/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Blank2Branded. Supplier of DTF + apparel. Minimum 5 pieces per order. Separate from Lifestyle Apparel (retail streetwear).</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-primary">Privacy</Link>
              <Link to="/terms" className="hover:text-primary">Terms</Link>
              <Link to="/returns" className="hover:text-primary">Returns</Link>
            </div>
          </div>
          <p className="mt-3 text-background/40">
            Sister brand: Lifestyle Apparel — retail streetwear.
          </p>
        </div>
      </div>
    </footer>
  );
}
