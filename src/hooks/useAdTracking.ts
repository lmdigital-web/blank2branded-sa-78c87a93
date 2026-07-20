import { useEffect } from "react";
import { useCurrentPath } from "@/lib/static-router";
import { initAdPixels, trackEvent } from "@/lib/ads/pixels";

export function useAdTracking() {
  const path = useCurrentPath();
  useEffect(() => {
    void initAdPixels();
  }, []);
  useEffect(() => {
    // Small delay so the page updates first
    const t = setTimeout(() => trackEvent("page_view"), 50);
    return () => clearTimeout(t);
  }, [path]);
}
