// Shared ecommerce helpers used by the cart, checkout and customer pages.

import type { CartItem } from "@/stores/cartStore";

export const SHIPPING_AMOUNT = 120;
export const MIN_APPAREL_QTY = 3;

// Match the same exemption logic as the server. Anything that isn't apparel
// (DTF prints, print services, setup fees) doesn't count toward the MOQ.
export function isApparelItem(item: { productHandle?: string; productTitle?: string }): boolean {
  const h = (item.productHandle ?? "").toLowerCase();
  const t = (item.productTitle ?? "").toLowerCase();
  if (h.startsWith("dtf-") || h.includes("dtf")) return false;
  if (h.includes("setup") || h.includes("add-on") || h.includes("addon") || h.includes("fee")) return false;
  if (t.includes("dtf") || t.includes("setup fee") || t.includes("add-on") || t.includes("add on")) return false;
  return true;
}

export function apparelQuantity(items: CartItem[]): number {
  return items.filter(isApparelItem).reduce((s, i) => s + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
}

export const ZA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

export function formatZAR(n: number): string {
  return `R ${n.toFixed(2)}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLOURS: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  in_production: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-rose-100 text-rose-800",
  refunded: "bg-zinc-200 text-zinc-800",
};
