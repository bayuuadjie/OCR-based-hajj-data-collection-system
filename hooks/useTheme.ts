"use client";

import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setIsDark(html.classList.contains("dark"));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return { isDark, toggle };
}