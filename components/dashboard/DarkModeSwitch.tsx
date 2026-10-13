"use client";

import { useTheme } from "@/hooks/useTheme";

export default function DarkModeSwitch({ collapsed = false }: { collapsed?: boolean }) {
  const { isDark, toggle } = useTheme();
  const checked = isDark === true;

  return (
    <>
      {/* Tampilan penuh (sidebar lebar, dan selalu di mobile) */}
      <div className={`flex items-center justify-between ${collapsed ? "lg:hidden" : ""}`}>
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

      {/* Tampilan ikon saja (sidebar diperkecil, hanya di desktop) */}
      <button
        type="button"
        onClick={toggle}
        title="Mode Gelap / Terang"
        aria-label="Ganti mode gelap atau terang"
        className={`${
          collapsed ? "hidden lg:flex" : "hidden"
        } w-full h-10 items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors duration-150`}
      >
        <span className="material-symbols-outlined">{checked ? "light_mode" : "dark_mode"}</span>
      </button>
    </>
  );
}