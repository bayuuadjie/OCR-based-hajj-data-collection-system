type TopbarProps = {
  user: {
    name: string;
    role: "ADMIN" | "OPERATOR";
  };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="w-full flex justify-between items-center px-gutter-sm sm:px-gutter h-16 border-b border-outline-variant bg-surface-container-lowest z-10 flex-shrink-0">
      {/* Search */}
      <div className="hidden sm:flex items-center w-full max-w-md relative">
        <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
          search
        </span>
        <input
          className="w-full h-10 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant text-body-md placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all duration-150"
          placeholder="Cari data jemaah, NIK, No Porsi..."
          type="text"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-space-sm sm:gap-space-md ml-auto">
        <button
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors duration-150"
          title="Notifikasi Verifikasi"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-6 w-px bg-outline-variant mx-1 hidden sm:block" />

        <div className="flex items-center gap-space-sm pl-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm border border-outline-variant shadow-sm">
              {initials(user.name)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim border-2 border-surface-container-lowest" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-label-md font-label-md font-semibold text-on-surface leading-tight">
              {user.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-bold text-[10px] tracking-wider uppercase">
                {user.role === "ADMIN" ? "Admin" : "Operator"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}