"use client";

import ThemeToggle from "@/components/ThemeToggle";

function initialsOf(name: string) {
  const words = name
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]);
  return (letters.join("") || "?").toUpperCase();
}

export default function Topbar({
  user,
  onMenuClick,
}: {
  user: { name: string; role: "ADMIN" | "OPERATOR" };
  onMenuClick: () => void;
}) {
  return (
    <header className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md z-10 flex-shrink-0 transition-colors duration-200">
      {/* Kiri: Tombol Menu Mobile & Judul Bagian */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka navigasi menu"
          title="Buka Menu"
          className="lg:hidden p-2 -ml-1 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors duration-150 shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex w-2 h-2 rounded-full bg-primary" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-bold font-headline-sm text-on-surface truncate leading-tight">
              Sistem Pendataan Haji &amp; Umrah
            </h1>
            <span className="hidden sm:block text-[11px] text-on-surface-variant font-medium truncate">
              Kantor Kementerian Haji &amp; Umrah Kabupaten Magetan
            </span>
          </div>
        </div>
      </div>

      {/* Kanan: Theme Toggle, Notifikasi, User Avatar */}
      <div className="flex items-center gap-4 sm:gap-3 shrink-0">
        {/* Toggle Dark/Light Mode */}
        <ThemeToggle />

        <div className="h-6 w-px bg-outline-variant mx-0.5 sm:mx-1" />

        {/* Profil Pengguna */}
        <div className="flex items-center gap-4 pl-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#E05300] text-white flex items-center justify-center text-label-md font-bold shadow-sm shrink-0">
            {initialsOf(user.name)}
          </div>
          <div className="hidden mr-5 md:flex flex-col text-left min-w-0">
            <span className="text-label-md font-semibold text-on-surface leading-tight truncate max-w-[160px]">
              {user.name}
            </span>
            <span className="mt-0.5 inline-block w-fit py-0.2 rounded-md bg-primary/10 text-primary font-bold text-[10px] tracking-wider uppercase">
              {user.role === "ADMIN" ? "Admin" : "Operator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}