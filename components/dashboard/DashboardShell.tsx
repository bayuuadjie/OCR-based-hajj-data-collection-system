"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const STORAGE_KEY = "sidebar-collapsed";
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

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

  useEffect(() => {
    let lastActivityAt = Date.now();
    let lastHeartbeatAt = 0;
    let heartbeatInProgress = false;

    const heartbeat = async () => {
      if (heartbeatInProgress || document.visibilityState !== "visible") return;
      heartbeatInProgress = true;
      try {
        const response = await fetch("/api/auth/heartbeat", {
          method: "POST",
          credentials: "include",
        });
        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(`Heartbeat gagal: ${response.status}`);
        }
        lastHeartbeatAt = Date.now();
      } catch (error) {
        console.error("Gagal memperbarui sesi login:", error);
      } finally {
        heartbeatInProgress = false;
      }
    };

    const markActivity = () => {
      lastActivityAt = Date.now();
      if (lastActivityAt - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
        void heartbeat();
      }
    };

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityAt < INACTIVITY_TIMEOUT_MS) {
        void heartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "scroll"] as const;
    activityEvents.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    document.addEventListener("visibilitychange", markActivity);
    void heartbeat();

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((event) => window.removeEventListener(event, markActivity));
      document.removeEventListener("visibilitychange", markActivity);
    };
  }, []);

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