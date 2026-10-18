"use client";

import { useEffect, useState } from "react";

export function useTheme() {
  // null di render pertama supaya cocok dengan server (hindari hydration mismatch);
  // nilai sebenarnya diambil dari class yang sudah di-set inline script di <head>.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setIsDark(html.classList.contains("dark"));
    sync();

    // Ikut berubah kalau tema diganti dari tempat lain (mis. halaman Pengaturan)
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