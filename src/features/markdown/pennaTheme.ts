import { useEffect, useRef } from "react";

export function usePennaDark() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () =>
      root.current?.classList.toggle(
        "penna-dark",
        document.documentElement.dataset.theme === "dark",
      );
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return root;
}
