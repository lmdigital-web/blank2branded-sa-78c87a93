import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  params?: Record<string, string | number>;
  activeOptions?: { exact?: boolean };
  activeProps?: { className?: string };
};

function getCurrentPath() {
  return window.location.pathname;
}

export function buildPath(to: string, params?: Record<string, string | number>) {
  if (!params) return to;
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`$${key}`, encodeURIComponent(String(value))),
    to,
  );
}

export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function useCurrentPath() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const onChange = () => setPath(getCurrentPath());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  return path;
}

export function useProductHandle() {
  const path = useCurrentPath();
  const match = path.match(/^\/products\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function Link({
  to,
  params,
  activeOptions,
  activeProps,
  className,
  onClick,
  ...props
}: LinkProps) {
  const path = useCurrentPath();
  const href = buildPath(to, params);
  const hrefPath = href.split(/[?#]/)[0] || "/";
  const isActive = activeOptions?.exact
    ? path === hrefPath
    : hrefPath !== "/"
      ? path === hrefPath || path.startsWith(`${hrefPath}/`)
      : path === "/";
  const mergedClassName = [className, isActive ? activeProps?.className : undefined]
    .filter(Boolean)
    .join(" ");

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank" ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#")
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return <a href={href} className={mergedClassName} onClick={handleClick} {...props} />;
}