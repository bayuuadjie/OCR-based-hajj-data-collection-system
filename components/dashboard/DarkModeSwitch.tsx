"use client";

import { useTheme } from "@/hooks/useTheme";

export default function DarkModeSwitch() {
  const { isDark, toggle } = useTheme();
  const checked = isDark === true;

  return (
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-space-xs cursor-pointer select-none" onClick={toggle}>
        <span className="material-symbols-outlined text-outline text-[18px]">dark_mode</span>
        <span className="text-[11px] font-semibold text-on-surface-variant">Mode Gelap</span>
      </label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Ganti mode gelap atau terang"
        onClick={toggle}
        className={`w-8 h-4 rounded-full border relative flex items-center p-0.5 transition-colors duration-150 focus:outline-none ${
          checked
            ? "bg-primary-container border-primary-container justify-end"
            : "bg-surface-container-highest border-outline-variant justify-start"
        }`}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
            checked ? "bg-on-primary" : "bg-outline"
          }`}
        />
      </button>
    </div>
  );
}