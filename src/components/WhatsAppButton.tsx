import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "27698384045";
const MESSAGE = "Hi Blank2Branded, I'd like a quote (min 3 pieces).";

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const opened = window.open(href, "_blank", "noopener,noreferrer");
    if (!opened) {
      // Popup blocked or sandboxed iframe — break out to top.
      try {
        window.top!.location.href = href;
      } catch {
        window.location.href = href;
      }
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all hover:scale-105 hover:shadow-xl md:bottom-8 md:right-8"
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
        <MessageCircle className="relative h-5 w-5" fill="currentColor" />
      </span>
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
