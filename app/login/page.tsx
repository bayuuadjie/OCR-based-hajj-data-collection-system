import type { Metadata } from "next";
import LoginForm from "@/components/login/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Login - Sistem Pendataan Hajj & Umrah",
};

export default function LoginPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      {/* Watermark / dekorasi latar - overflow-hidden di parent mencegah ini menambah tinggi scroll */}
      <div className="absolute inset-0 watermark-grid pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-fixed opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary-fixed opacity-30 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full flex justify-between items-center gap-2 px-gutter-sm sm:px-gutter md:px-margin h-16 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-space-sm min-w-0">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mosque
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-[15px] sm:text-headline-sm font-bold text-primary tracking-tight leading-tight truncate">
              Sistem Pendataan Hajj &amp; Umrah
            </span>
            <span className="hidden sm:block font-label-sm text-label-sm text-on-surface-variant leading-none truncate">
              Direktorat Jenderal Penyelenggaraan Haji dan Umrah
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
          <a
            href="#help"
            className="hidden sm:flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-150 py-1 px-2 rounded hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span className="hidden md:inline">Bantuan Teknis</span>
          </a>
          <div className="hidden sm:flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded border border-outline-variant">
            <span className="material-symbols-outlined text-[16px]">language</span>
            <span>IDN</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Kartu login */}
      <main className="flex-1 flex items-center justify-center px-gutter-sm sm:px-gutter md:px-margin py-space-lg sm:py-space-xl z-10">
        <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 sm:p-6 md:p-8 flex flex-col relative transition-colors duration-200">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-md ring-4 ring-primary-fixed">
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center border-2 border-surface-container-lowest shadow-sm">
                <span
                  className="material-symbols-outlined text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock
                </span>
              </div>
            </div>
            <h1 className="font-headline-md text-[20px] sm:text-headline-md text-on-surface font-bold tracking-tight">
              Sistem Pendataan Hajj &amp; Umrah
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xs">
              Silakan login untuk mengakses dashboard data
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/60">
              <span className="material-symbols-outlined text-[15px] text-tertiary">
                shield
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-normal font-semibold">
                Portal Internal Resmi &amp; Terenkripsi
              </span>
            </div>
          </div>

          <LoginForm />

          <div className="mt-6 p-3 rounded bg-surface-container-low border border-outline-variant/60 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
              Akses terbatas untuk staf dan operator data jemaah terdaftar.
              Seluruh aktivitas login dipantau demi keamanan data jemaah.
            </p>
          </div>
        </div>
      </main>

      {/* Footer - ringkas, satu baris, menempel di bawah */}
      <footer className="w-full py-3 px-gutter-sm sm:px-gutter md:px-margin border-t border-outline-variant bg-surface z-10 shrink-0">
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-center">
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            © {new Date().getFullYear()} Kemenag RI - Sistem Pendataan Hajj &amp; Umrah
          </span>
          <span className="text-outline-variant">•</span>
          <a href="#bantuan" className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors duration-150">
            Bantuan
          </a>
          <span className="text-outline-variant">•</span>
          <a href="#keamanan" className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors duration-150">
            Kebijakan Keamanan
          </a>
        </div>
      </footer>
    </div>
  );
}
