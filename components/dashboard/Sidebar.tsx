"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DarkModeSwitch from "./DarkModeSwitch";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
}: {
  role: "ADMIN" | "OPERATOR";
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // "collapsed" hanya berlaku di layar besar (lg ke atas). Di mobile sidebar selalu penuh.
  const hide = collapsed ? "lg:hidden" : "";
  const center = collapsed ? "lg:justify-center lg:px-0" : "";

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Tetap lanjut ke halaman login walau server tidak merespons
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[268px] lg:static lg:z-20 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between select-none transition-all duration-200 ${
        mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
      } lg:translate-x-0 lg:shadow-none ${collapsed ? "lg:w-[72px]" : "lg:w-[268px]"}`}
    >
      <div className="flex flex-col min-h-0">
        {/* Brand */}
        <div
          className={`h-16 px-space-base flex items-center gap-space-sm border-b border-outline-variant shrink-0 ${center}`}
        >
          <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              mosque
            </span>
          </div>
          <div className={`flex flex-col min-w-0 flex-1 ${hide}`}>
            <span className="text-label-md font-headline-sm font-bold text-primary tracking-tight truncate leading-tight">
              Sistem Pendataan Hajj &amp; Umrah
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium tracking-tight truncate leading-tight">
              Ditjen PHU Kemenag RI
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="lg:hidden p-1 rounded text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Menu */}
        <nav className="p-space-sm space-y-space-2xs overflow-y-auto">
          <div
            className={`px-space-sm py-space-xs text-label-sm font-label-sm uppercase tracking-wider text-outline ${hide}`}
          >
            Menu Operasional
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
                className={`flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg transition-colors duration-150 ${center} ${
                  isActive
                    ? "bg-surface-container text-primary font-bold"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <span
                  className={`material-symbols-outlined shrink-0 ${isActive ? "text-primary" : "text-outline"}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className={`text-label-lg font-label-lg truncate ${isActive ? "" : "font-medium"} ${hide}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bagian bawah */}
      <div className="p-space-base border-t border-outline-variant bg-surface space-y-space-sm shrink-0">
        <DarkModeSwitch collapsed={collapsed} />

        <div className="pt-space-xs border-t border-outline-variant space-y-1">
          <a
            href="#help"
            title="Bantuan Teknis"
            className={`flex items-center gap-space-xs px-space-sm py-space-sm rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors duration-150 ${center}`}
          >
            <span className="material-symbols-outlined text-outline text-[18px] shrink-0">help_outline</span>
            <span className={`text-label-sm font-label-sm ${hide}`}>Bantuan Teknis</span>
          </a>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title="Keluar"
            className={`w-full flex items-center gap-space-xs px-space-sm py-space-sm rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors duration-150 disabled:opacity-60 ${center}`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">logout</span>
            <span className={`text-label-sm font-label-sm ${hide}`}>
              {loggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}