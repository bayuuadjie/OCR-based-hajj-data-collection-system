import type { Metadata } from "next";
import LoginForm from "@/components/login/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Login - Sistem Pendataan Haji & Umrah",
  description: "Portal resmi pendataan dan rekapitulasi berkas jemaah haji & umrah",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row text-on-surface overflow-x-hidden">
      {/* =====================================================================
          DESKTOP LEFT SIDE: Visual Hero Image & Sunset Overlay
          ===================================================================== */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 xl:w-7/12 min-h-screen overflow-hidden bg-black select-none">
        {/* Foto Assets */}
        <img
          src="/assets/login-img.jpg"
          alt="Masjidil Haram Makkah"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out"
        />

        {/* Multi-layer Sunset & Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/25 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F96A0E]/30 via-transparent to-black/70 mix-blend-color z-[2]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#F96A0E]/20 blur-3xl pointer-events-none z-[2]" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-[#FFA500]/15 blur-3xl pointer-events-none z-[2]" />

        {/* Konten Overlay Desktop */}
        <div className="relative z-10 flex flex-col justify-between w-full h-full p-10 xl:p-14 text-white">
          {/* Header Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <img
                src="/assets/logo.png"
                alt="Logo Kementerian Haji dan Umrah"
                className="w-11 h-11 object-contain drop-shadow"
              />
            </div>
            <div>
              <p className="font-headline-sm text-sm xl:text-base font-bold tracking-wider uppercase text-white/95">
                Kementerian Haji &amp; Umrah
              </p>
              <p className="text-xs font-medium tracking-wide text-white/70">
                Republik Indonesia • Kantor Kab. Magetan
              </p>
            </div>
          </div>

          {/* Hero Headline & Glass Card */}
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#F96A0E] animate-pulse" />
              Portal Pendataan Terintegrasi
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-extrabold font-headline-lg text-white leading-tight drop-shadow-md">
                Sistem Pendataan &amp; Rekapitulasi Berkas Jemaah
              </h1>
              <p className="text-sm xl:text-base text-white/80 leading-relaxed font-normal">
                Mempercepat verifikasi berkas pendaftaran jemaah haji dan umrah dengan dukungan ekstraksi dokumen berbasis OCR otomatis, aman, dan terstruktur.
              </p>
            </div>

            {/* Fitur Utama Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex flex-col gap-1.5">
                <span className="material-symbols-outlined text-[#FFA05A] text-2xl">
                  document_scanner
                </span>
                <span className="text-xs font-semibold text-white">OCR Otomatis</span>
                <span className="text-[11px] text-white/70 leading-snug">Ekstraksi berkas instan</span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex flex-col gap-1.5">
                <span className="material-symbols-outlined text-[#FFA05A] text-2xl">
                  verified_user
                </span>
                <span className="text-xs font-semibold text-white">Tervalidasi</span>
                <span className="text-[11px] text-white/70 leading-snug">Sesuai standar</span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex flex-col gap-1.5">
                <span className="material-symbols-outlined text-[#FFA05A] text-2xl">
                  encrypted
                </span>
                <span className="text-xs font-semibold text-white">Terenkripsi</span>
                <span className="text-[11px] text-white/70 leading-snug">Aman &amp; terlindungi</span>
              </div>
            </div>
          </div>

          {/* Footer Caption */}
          <div className="flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/10">
            <span>Masjidil Haram, Makkah Al-Mukarramah</span>
            <span>Versi 1.0</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT SIDE (Desktop) & FORM AREA (Mobile Responsive)
          ===================================================================== */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between min-h-screen bg-surface-container-lowest transition-colors duration-200">
        {/* Mobile Hero Banner (< lg) */}
        <div className="lg:hidden relative h-52 sm:h-64 w-full overflow-hidden select-none">
          <img
            src="/assets/login-img.jpg"
            alt="Masjidil Haram"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#F96A0E]/35 to-black/60 mix-blend-color" />

          {/* Header Mobile dalam banner */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <img
                src="/assets/logo.png"
                alt="Logo Kemenhaj"
                className="w-9 h-9 object-contain drop-shadow"
              />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Kemenhaj Magetan
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="absolute bottom-6 left-4 right-4 z-10 text-white">
            <h2 className="text-xl font-bold font-headline-md leading-tight text-white drop-shadow">
              Sistem Pendataan Haji &amp; Umrah
            </h2>
            <p className="text-xs text-white/80 mt-1">
              Portal internal staf dan operator data jemaah
            </p>
          </div>
        </div>

        {/* Top Navbar Desktop*/}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-outline-variant/50">
          <div className="flex items-center gap-2 text-on-surface-variant text-label-sm font-medium">
            <span className="material-symbols-outlined text-[17px] text-primary">
              security
            </span>
            <span>Portal Internal Terverifikasi</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant">
              <span className="material-symbols-outlined text-[15px]">language</span>
              <span>IDN</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Form Container */}
        <main className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 py-8 z-10">
          <div className="w-full max-w-[420px] mx-auto">
            {/* Header Form */}
            <div className="text-center mb-6">
              <div className="inline-block relative mb-3">
                <div className="w-18 h-18 p-1.5 rounded-2xl bg-gradient-to-br from-[#FFE4D0] to-[#FFD0B0] dark:from-[#3D1800] dark:to-[#251000] border border-primary/20 shadow-md">
                  <img
                    src="/assets/logo.png"
                    alt="Logo Garuda Kementerian Haji dan Umrah"
                    className="w-14 h-14 object-contain mx-auto drop-shadow"
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold font-headline-md text-on-surface tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1.5">
                Silakan masuk dengan akun resmi untuk mengakses dashboard
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant text-[11px] font-semibold text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span>Koneksi Aman &amp; Terenkripsi</span>
              </div>
            </div>

            {/* Komponen Form Login */}
            <LoginForm />

            {/* Informasi Akses Staf */}
            <div className="mt-6 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[19px] shrink-0 mt-0.5">
                shield
              </span>
              <p className="text-label-sm text-on-surface-variant leading-relaxed">
                Akses terbatas untuk staf dan operator data jemaah. Seluruh aktivitas login diawasi demi keamanan dan integritas data.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-4 px-6 border-t border-outline-variant/60 bg-surface text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span>© {new Date().getFullYear()} Kementerian Haji &amp; Umrah Kab. Magetan</span>
            <span className="text-outline-variant">•</span>
            <a href="#privacy" className="hover:text-primary transition-colors">
              Kebijakan Privasi
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
