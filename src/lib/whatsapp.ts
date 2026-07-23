// WhatsApp order helper — funnels catalogue orders into WhatsApp instead of
// running a card-based checkout.

export const WHATSAPP_NUMBER = "27698384045";
export const WHATSAPP_DISPLAY = "+27 69 838 4045";

export type WhatsAppLineItem = {
  title: string;
  variantTitle?: string;
  selectedOptions?: Array<{ name: string; value: string }>;
  quantity: number;
  price?: { amount: string; currencyCode: string };
  handle?: string;
};

export type WhatsAppCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
};

export const SHIPPING_FEE = 150;
export const SHIPPING_CURRENCY = "ZAR";

function siteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://blank2branded.co.za";
}

function formatLine(item: WhatsAppLineItem): string {
  const opts =
    item.selectedOptions?.filter((o) => o.value).map((o) => o.value).join(" / ") ||
    item.variantTitle ||
    "";
  const priceStr = item.price
    ? ` @ ${item.price.currencyCode} ${parseFloat(item.price.amount).toFixed(2)}`
    : "";
  const suffix = opts ? ` — ${opts}` : "";
  return `• ${item.title}${suffix} × ${item.quantity}${priceStr}`;
}

export function buildOrderMessage(
  items: WhatsAppLineItem[],
  customer?: WhatsAppCustomer,
): string {
  if (items.length === 0) return "Hi Blank2Branded, I'd like a quote.";
  const lines = items.map(formatLine).join("\n");
  const subtotal = items.reduce(
    (s, i) => s + (i.price ? parseFloat(i.price.amount) * i.quantity : 0),
    0,
  );
  const currency = items.find((i) => i.price)?.price?.currencyCode ?? "ZAR";
  const total = subtotal + SHIPPING_FEE;
  const totalsStr =
    subtotal > 0
      ? `\n\nSubtotal: ${currency} ${subtotal.toFixed(2)}\nShipping: ${currency} ${SHIPPING_FEE.toFixed(2)}\nEstimated total: ${currency} ${total.toFixed(2)}`
      : "";

  const firstHandle = items.find((i) => i.handle)?.handle;
  const link = firstHandle ? `\nLink: ${siteOrigin()}/products/${firstHandle}/` : "";

  const customerStr = customer
    ? `\n\nCustomer details:\nName: ${customer.firstName} ${customer.lastName}\nPhone: ${customer.phone}\nEmail: ${customer.email}\nDelivery address: ${customer.address}`
    : "";

  return `Hi Blank2Branded, I'd like to order:\n\n${lines}${totalsStr}${customerStr}${link}\n\nPlease confirm the quote and payment details.`;
}

export function buildEnquiryMessage(item: WhatsAppLineItem): string {
  return buildOrderMessage([item]);
}


export function whatsappHref(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string): void {
  const href = whatsappHref(message);
  const opened =
    typeof window !== "undefined"
      ? window.open(href, "_blank", "noopener,noreferrer")
      : null;
  if (!opened && typeof window !== "undefined") {
    try {
      window.top!.location.href = href;
    } catch {
      window.location.href = href;
    }
  }
}
