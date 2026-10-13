"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
  }

  return (
    <header className="w-full flex items-center justify-between gap-space-sm px-gutter-sm sm:px-gutter h-16 border-b border-outline-variant bg-surface-container-lowest z-10 flex-shrink-0">
      <div className="flex items-center gap-space-sm flex-1 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka atau tutup menu"
          title="Menu"
          className="p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors duration-150 shrink-0"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Mobile: nama aplikasi singkat */}
        <span className="sm:hidden text-label-lg font-label-lg font-bold text-primary truncate">
          Pendataan Hajj &amp; Umrah
        </span>

        {/* Pencarian (sm ke atas) */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center w-full max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, alamat, No. Porsi..."
            className="w-full h-10 pl-10 pr-4 bg-surface text-on-surface rounded-lg border border-outline-variant text-body-md placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all duration-150"
          />
        </form>
      </div>

      <div className="flex items-center gap-space-sm shrink-0">
        <button
          type="button"
          title="Notifikasi (segera hadir)"
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors duration-150"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-6 w-px bg-outline-variant mx-1" />

        <div className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center text-label-md font-bold shadow-sm shrink-0">
            {initialsOf(user.name)}
          </div>
          <div className="hidden lg:flex flex-col text-left min-w-0">
            <span className="text-label-md font-label-md font-semibold text-on-surface leading-tight truncate max-w-[180px]">
              {user.name}
            </span>
            <span className="mt-0.5 inline-block w-fit px-1.5 rounded bg-surface-container-highest text-primary font-bold text-[10px] tracking-wider uppercase">
              {user.role === "ADMIN" ? "Admin" : "Operator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}