"use client";

import { useEffect, useState } from "react";

export function useTheme() {
  // null di render pertama supaya cocok dengan server (hindari hydration mismatch);
  // nilai sebenarnya diambil dari class yang sudah di-set inline script di <head>.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return { isDark, toggle };
}