"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const STORAGE_KEY = "sidebar-collapsed";

export default function DashboardShell({
  user,
  children,
}: {
  user: { name: string; role: "ADMIN" | "OPERATOR" };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false); // desktop: sidebar diperkecil
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: sidebar sebagai menu geser

  // Ingat pilihan perkecil/perbesar sidebar
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  // Tutup menu geser setiap pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Tutup menu geser dengan tombol Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function handleToggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {}
  }

  function handleMenuClick() {
    setMobileOpen((open) => !open);
  }

  return (
    <div className="bg-background text-on-surface antialiased flex h-dvh overflow-hidden">
      {/* Backdrop mobile saat sidebar terbuka */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        role={user.role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Topbar user={user} onMenuClick={handleMenuClick} />
        {children}
      </div>
    </div>
  );
}