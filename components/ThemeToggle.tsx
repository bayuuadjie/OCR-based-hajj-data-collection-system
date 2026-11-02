"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti mode gelap atau terang"
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-surface-container transition-all duration-200 shadow-sm active:scale-95"
    >
      <span className="material-symbols-outlined text-[19px] transition-transform duration-300 hover:rotate-12">
        {isDark === null ? "dark_mode" : isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}