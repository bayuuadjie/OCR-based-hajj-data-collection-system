"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti mode gelap atau terang"
      title="Mode Gelap / Terang"
      className="flex items-center justify-center w-8 h-8 rounded bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-150"
    >
      <span className="material-symbols-outlined text-[18px]">
        {isDark === null ? "dark_mode" : isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
