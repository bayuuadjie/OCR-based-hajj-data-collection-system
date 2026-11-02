"use client";

import { useTheme } from "@/hooks/useTheme";

export default function DarkModeSwitch({ collapsed = false }: { collapsed?: boolean }) {
  const { isDark, toggle } = useTheme();
  const checked = isDark === true;

  return (
    <>
      {/* Tampilan penuh (sidebar lebar, dan selalu di mobile) */}
      <div className={`flex items-center justify-between ${collapsed ? "lg:hidden" : ""}`}>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={toggle}>
          <span className="material-symbols-outlined text-outline text-[18px]">dark_mode</span>
          <span className="text-label-sm font-semibold text-on-surface-variant">Mode Gelap</span>
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label="Ganti mode gelap atau terang"
          onClick={toggle}
          className={`w-10 h-5 rounded-full border relative flex items-center p-0.5 transition-colors duration-200 focus:outline-none ${
            checked
              ? "bg-primary border-primary justify-end shadow-[0_0_10px_rgba(249,106,14,0.4)]"
              : "bg-surface-container-highest border-outline-variant justify-start"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
              checked ? "bg-white" : "bg-outline"
            }`}
          />
        </button>
      </div>

      {/* Tampilan ikon saja (sidebar diperkecil, hanya di desktop) */}
      <button
        type="button"
        onClick={toggle}
        title={checked ? "Mode Terang" : "Mode Gelap"}
        aria-label="Ganti mode gelap atau terang"
        className={`${
          collapsed ? "hidden lg:flex" : "hidden"
        } w-10 h-10 mx-auto items-center justify-center rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-150`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {checked ? "light_mode" : "dark_mode"}
        </span>
      </button>
    </>
  );
}