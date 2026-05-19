import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal text-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <img src={logo} alt="Blank2Branded" className="h-16 w-auto rounded bg-background/5 p-2" />
          </div>
            <p className="mt-3 max-w-sm text-sm text-background/60">
              From Blank to Branded. Nationwide. Supplier of DTF transfers
              & blank apparel for South African brands, businesses and individuals. Minimum 5 pieces per order.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" aria-label="Instagram" className="rounded border border-background/20 p-2 hover:border-primary hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="rounded border border-background/20 p-2 hover:border-primary hover:text-primary">
                <Facebook className="h-4 w-4" />
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
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Get Quote</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-background/60">
              <li>hello@blank2branded.co.za</li>
              <li>Mon–Fri 8am–5pm</li>
              <li>Mbombela, South Africa</li>
              <li>Courier nationwide</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/10 pt-6 text-xs text-background/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Blank2Branded. Supplier of DTF + apparel. Minimum 5 pieces per order. Separate from Lifestyle Apparel (retail streetwear).</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary">Privacy</a>
              <a href="#" className="hover:text-primary">Terms</a>
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
