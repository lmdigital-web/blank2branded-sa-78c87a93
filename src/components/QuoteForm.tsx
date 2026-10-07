// Reusable "Request a Quote" form. Posts to the same send-contact-email edge
// function that /contact already uses, so no new backend is needed. The
// `service` prop is what makes it reusable: it tags the enquiry and pre-fills
// the message so Blank2Branded knows which page it came from.

import { useId, useState } from "react";
import { Send, Loader2, Upload, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { whatsappHref } from "@/lib/whatsapp";

export type QuoteFormProps = {
  /** Service page title, e.g. "DTF Printing". Stored with the enquiry. */
  service: string;
  /** Compact form for above-the-fold use on narrow columns. */
  variant?: "full" | "compact";
  className?: string;
};

const inputCls =
  "w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-charcoal placeholder-muted-foreground transition-colors focus:border-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls =
  "text-xs font-semibold uppercase tracking-wider text-charcoal";

export function QuoteForm({ service, variant = "full", className = "" }: QuoteFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const compact = variant === "compact";
  // The template renders this form twice per page, so field ids must be unique.
  const uid = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name,
          business: String(fd.get("business") ?? "").trim(),
          email: String(fd.get("email") ?? "").trim(),
          phone: String(fd.get("phone") ?? "").trim(),
          orderType: String(fd.get("orderType") ?? "").trim() || service,
          subject: `Quote request — ${service}`,
          message: `[Service page: ${service}]\n\n${message}`,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(
        "Couldn't send your enquiry. Please WhatsApp us on +27 69 838 4045.",
      );
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div
        className={`rounded-lg border-2 border-primary bg-surface p-8 text-center ${className}`}
      >
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Send className="h-6 w-6" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-charcoal">
          Thanks — we've got it.
        </h3>
        <p className="mt-3 text-charcoal/85">
          We'll reply within 4 business hours with pricing.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {!compact && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls} htmlFor={`${uid}-name`}>
              Name
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              required
              className={inputCls}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls} htmlFor={`${uid}-business`}>
              Business Name
            </label>
            <input
              id={`${uid}-business`}
              name="business"
              required
              className={inputCls}
              placeholder="Brand or company"
            />
          </div>
        </div>
      )}

      {!compact && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls} htmlFor={`${uid}-email`}>
              Email
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              required
              className={inputCls}
              placeholder="you@brand.co.za"
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls} htmlFor={`${uid}-phone`}>
              Phone
            </label>
            <input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              required
              className={inputCls}
              placeholder="+27 ..."
            />
          </div>
        </div>
      )}

      {compact && (
        <>
          <div className="space-y-2">
            <label className={labelCls} htmlFor={`${uid}-cname`}>
              Name
            </label>
            <input
              id={`${uid}-cname`}
              name="name"
              required
              className={inputCls}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls} htmlFor={`${uid}-cphone`}>
              Phone
            </label>
            <input
              id={`${uid}-cphone`}
              name="phone"
              type="tel"
              required
              className={inputCls}
              placeholder="+27 ..."
            />
          </div>
        </>
      )}

      {!compact && (
        <div className="space-y-2">
          <label className={labelCls} htmlFor={`${uid}-type`}>
            Order Type
          </label>
          <select
            id={`${uid}-type`}
            name="orderType"
            required
            className={inputCls}
          >
            <option value="">Select an option…</option>
                <option>{service}</option>
            <option>DTF Only</option>
            <option>Blanks Only</option>
            <option>Full Service (Print + Press)</option>
          </select>
        </div>
      )}
      {compact && <input type="hidden" name="orderType" value={service} />}

      <div className="space-y-2">
        <label className={labelCls} htmlFor={`${uid}-message`}>
          What do you need?
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          required
          rows={compact ? 3 : 5}
          className={inputCls}
          placeholder={`Tell us about your ${service.toLowerCase()} — quantity, sizes, deadline.`}
        />
      </div>

      {!compact && (
        <div className="space-y-2">
          <label className={labelCls}>Artwork (optional)</label>
          <label
            htmlFor={`${uid}-artwork`}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-dashed border-border bg-surface px-6 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-charcoal"
          >
            <Upload className="h-5 w-5" />
            Upload artwork (PNG, AI, PDF)
            <input
              id={`${uid}-artwork`}
              name="artwork"
              type="file"
              className="hidden"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-dtf px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <>
              Sending… <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              Request a Quote <Send className="h-4 w-4" />
            </>
          )}
        </button>
        <a
          href={whatsappHref(
            `Hi Blank2Branded, I'd like a quote for ${service}.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary px-7 py-4 text-sm font-semibold text-charcoal transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp us
        </a>
      </div>
    </form>
  );
}