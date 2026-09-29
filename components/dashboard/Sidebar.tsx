"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DarkModeSwitch from "./DarkModeSwitch";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/input", label: "Input Data Baru", icon: "person_add" },
  { href: "/dashboard/laporan", label: "Laporan", icon: "summarize" },
  { href: "/dashboard/users", label: "Manajemen Pengguna", icon: "manage_accounts", adminOnly: true },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: "settings" },
];

export default function Sidebar({ role }: { role: "ADMIN" | "OPERATOR" }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN");

  return (
    <aside className="w-[268px] flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between z-20 select-none">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="h-16 px-space-base flex items-center gap-space-sm border-b border-outline-variant">
          <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mosque
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-label-md font-headline-sm font-bold text-primary tracking-tight truncate leading-tight">
              Sistem Pendataan Hajj &amp; Umrah
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium tracking-tight truncate leading-tight">
              Ditjen PHU Kemenag RI
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-space-sm space-y-space-2xs">
          <div className="px-space-sm py-space-xs text-label-sm font-label-sm uppercase tracking-wider text-outline">
            Menu Operasional
          </div>
          {items.map((item) => {
            const active =
              item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg transition-colors duration-150 ${
                  active
                    ? "bg-surface-container text-primary font-bold"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${active ? "text-primary" : "text-outline"}`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className={`text-label-lg font-label-lg ${active ? "" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: dark mode, help, logout */}
      <div className="p-space-base border-t border-outline-variant bg-surface space-y-space-sm">
        <DarkModeSwitch />
        <a
          href="#bantuan"
          className="flex items-center gap-space-xs text-label-md text-on-surface-variant hover:text-primary transition-colors duration-150 pt-space-xs border-t border-outline-variant"
        >
          <span className="material-symbols-outlined text-outline text-[18px]">help_outline</span>
          <span className="text-label-sm font-label-sm">Bantuan Teknis</span>
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-space-xs text-label-md text-on-surface-variant hover:text-error transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-outline text-[18px]">logout</span>
          <span className="text-label-sm font-label-sm">Keluar</span>
        </button>
      </div>
    </aside>
  );
}