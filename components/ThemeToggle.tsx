"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

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