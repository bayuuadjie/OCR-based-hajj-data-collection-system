"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/input", label: "Input Data Baru", icon: "person_add" },
  { href: "/dashboard/laporan", label: "Laporan", icon: "summarize" },
  { href: "/dashboard/users", label: "Manajemen Pengguna", icon: "manage_accounts", adminOnly: true },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: "settings" },
];

export default function Sidebar({
  role,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: {
  role: "ADMIN" | "OPERATOR";
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const collapseText = collapsed
    ? "lg:max-w-0 lg:opacity-0"
    : "lg:max-w-[180px] lg:opacity-100";
  const center = collapsed ? "lg:justify-center lg:gap-0 lg:px-0" : "";

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Tetap lanjut ke halaman login walau server tidak merespons
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[272px] lg:static lg:z-20 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between select-none transition-[width,transform] duration-300 ease-in-out ${
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } lg:translate-x-0 lg:shadow-none ${collapsed ? "lg:w-[76px]" : "lg:w-[272px]"}`}
    >
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div
          className={`relative h-16 px-4 flex items-center justify-between border-b border-outline-variant shrink-0 transition-[padding] duration-300 ${center}`}
        >
          {/* Logo & Info */}
          <div
            className={`flex items-center gap-3 min-w-0 overflow-hidden transition-[gap] duration-300 ${
              collapsed ? "lg:gap-0" : ""
            }`}
          >
            <div
              className={`w-10 h-10 shrink-0 overflow-hidden rounded-xl bg-surface-container flex items-center justify-center p-1 border border-outline-variant/80 shadow-sm transition-[width,height,padding,opacity,transform] duration-300 ${
                collapsed
                  ? "lg:w-0 lg:h-0 lg:border-transparent lg:p-0 lg:opacity-0 lg:scale-90"
                  : ""
              }`}
            >
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            <div
              className={`flex flex-col min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] duration-300 ${collapseText}`}
            >
              <span className="text-label-md font-headline-sm font-bold text-on-surface tracking-tight truncate leading-tight">
                Pendataan Haji &amp; Umrah
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium tracking-tight truncate leading-tight mt-0.5">
                Kemenhaj Kab. Magetan
              </span>
            </div>
          </div>

          {/* Tombol Extended / Collapse di dalam Sidebar (Desktop) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            aria-label={collapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            className={`hidden lg:flex shrink-0 items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-[color,background-color,left,transform] duration-300 ${
              collapsed ? "lg:absolute lg:left-1/2 lg:-translate-x-1/2" : ""
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "last_page" : "first_page"}
            </span>
          </button>

          {/* Tombol Tutup di Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          <div className="h-9 px-3 flex items-center overflow-hidden">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider text-outline whitespace-nowrap transition-[opacity,transform] duration-300 ${
                collapsed ? "lg:hidden" : "opacity-100"
              }`}
            >
              Menu Operasional
            </span>
            <span
              className={`text-[11px] px-2 font-bold uppercase tracking-wider text-outline ${
                collapsed ? "hidden lg:inline" : "hidden"
              }`}
              aria-hidden="true"
            >
              —
            </span>
          </div>

          {navItems.map((item) => {
            if (item.adminOnly && role !== "ADMIN") return null;

            const isActive =
              item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${center} ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold border border-primary/25 shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-medium"
                }`}
              >
                <span
                  className={`material-symbols-outlined shrink-0 text-[20px] ${
                    isActive ? "text-primary" : "text-outline"
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-label-lg font-label-lg truncate overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${collapseText}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bagian Bawah Sidebar */}
      <div className="p-3.5 border-t border-outline-variant bg-surface space-y-2.5 shrink-0">

        <div className="pt-2 border-t border-outline-variant/70 space-y-1">
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title="Keluar dari Sistem"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors duration-150 disabled:opacity-60 cursor-pointer ${center}`}
          >
            <span className="material-symbols-outlined text-error text-[19px] shrink-0">
              logout
            </span>
            <span
              className={`text-label-sm font-medium overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${collapseText}`}
            >
              {loggingOut ? "Mengeluarkan..." : "Keluar Akun"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}