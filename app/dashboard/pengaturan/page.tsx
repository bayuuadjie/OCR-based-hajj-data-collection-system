"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Profile = {
  username: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "OPERATOR";
  createdAt: string;
};

type SystemStatus = {
  database: { ok: boolean };
  ocr: { ok: boolean; message?: string; tesseract?: string; lang?: string; pdf?: boolean };
  warnings: string[];
};

type Msg = { kind: "ok" | "error"; text: string } | null;
type ThemeChoice = "light" | "dark" | "system";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Terjadi kesalahan.");
  return data as T;
}

const inputClass =
  "w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant";
const primaryBtn =
  "h-10 px-space-base rounded-lg bg-primary-container text-on-primary hover:bg-primary text-label-lg font-label-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base sm:p-space-lg">
      <h2 className="text-title-md font-title-md text-on-surface">{title}</h2>
      {description && <p className="text-label-md font-label-md text-on-surface-variant mt-0.5">{description}</p>}
      <div className="mt-space-base">{children}</div>
    </section>
  );
}

function Banner({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <div
      role={msg.kind === "error" ? "alert" : "status"}
      className={`p-3 rounded border text-label-md font-label-md ${
        msg.kind === "error"
          ? "bg-error-container/60 border-error/30 text-on-error-container"
          : "bg-tertiary-fixed/60 border-tertiary-fixed-dim text-on-tertiary-fixed"
      }`}
    >
      {msg.text}
    </div>
  );
}

function getThemeChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}

function applyTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") window.localStorage.removeItem("theme");
    else window.localStorage.setItem("theme", choice);
  } catch {
    // penyimpanan browser tidak tersedia: tema tetap berubah untuk sesi ini
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", choice === "dark" || (choice === "system" && prefersDark));
}

const THEMES: { key: ThemeChoice; label: string; icon: string }[] = [
  { key: "light", label: "Terang", icon: "light_mode" },
  { key: "dark", label: "Gelap", icon: "dark_mode" },
  { key: "system", label: "Ikuti sistem", icon: "brightness_auto" },
];

export default function PengaturanPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profil
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);

  // Password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  // Tema
  const [theme, setTheme] = useState<ThemeChoice>("system");

  // Status sistem (admin)
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setTheme(getThemeChoice());
    api<Profile>("/api/account")
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setEmail(p.email ?? "");
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Gagal memuat akun."));
  }, []);

  const checkSystem = useCallback(async () => {
    setChecking(true);
    try {
      setStatus(await api<SystemStatus>("/api/account/system"));
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === "ADMIN") checkSystem();
  }, [profile?.role, checkSystem]);

  const profileDirty = profile !== null && (name.trim() !== profile.name || email.trim() !== (profile.email ?? ""));

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await api<{ message: string; profile: Profile }>("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      setProfile(res.profile);
      setName(res.profile.name);
      setEmail(res.profile.email ?? "");
      setProfileMsg({ kind: "ok", text: res.message });
      router.refresh(); // muat ulang agar nama di pojok kanan atas ikut berubah
    } catch (err) {
      setProfileMsg({ kind: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSavingProfile(false);
    }
  }

  const checks = {
    length: next.length >= 8,
    different: next.length > 0 && next !== current,
    match: confirm.length > 0 && next === confirm,
  };

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (!current) return setPwMsg({ kind: "error", text: "Isi password saat ini." });
    if (!checks.length) return setPwMsg({ kind: "error", text: "Password baru minimal 8 karakter." });
    if (!checks.different) return setPwMsg({ kind: "error", text: "Password baru harus berbeda dari password saat ini." });
    if (!checks.match) return setPwMsg({ kind: "error", text: "Konfirmasi password baru tidak sama." });

    setSavingPw(true);
    try {
      const res = await api<{ message: string }>("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setPwMsg({ kind: "ok", text: res.message });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setPwMsg({ kind: "error", text: err instanceof Error ? err.message : "Gagal mengganti password." });
    } finally {
      setSavingPw(false);
    }
  }

  function chooseTheme(choice: ThemeChoice) {
    setTheme(choice);
    applyTheme(choice);
  }

  const pwType = showPw ? "text" : "password";

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col gap-space-lg">
      <section>
        <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface">Pengaturan</h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Kelola profil, keamanan akun, dan tampilan.</p>
      </section>

      {loadError && <Banner msg={{ kind: "error", text: loadError }} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-lg items-start">
        {/* Profil */}
        <Card title="Profil Saya" description="Nama ini tampil di pojok kanan atas.">
          {!profile ? (
            <p className="text-body-sm text-on-surface-variant">{loadError ? "" : "Memuat..."}</p>
          ) : (
            <form onSubmit={saveProfile} className="space-y-space-base">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-base">
                <div className="flex flex-col gap-1">
                  <label htmlFor="s-username" className={labelClass}>Username</label>
                  <input id="s-username" className={inputClass} value={profile.username} disabled readOnly />
                </div>
                <div className="flex flex-col gap-1">
                  <span className={labelClass}>Role</span>
                  <div className="h-10 flex items-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-secondary-container text-on-secondary-container border-secondary-fixed">
                      {profile.role === "ADMIN" ? "Admin" : "Operator"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="s-name" className={labelClass}>Nama Lengkap</label>
                <input id="s-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="s-email" className={labelClass}>Email (opsional)</label>
                <input id="s-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} placeholder="nama@kemenag.go.id" />
              </div>

              <p className="text-label-md font-label-md text-outline">
                Akun dibuat {new Date(profile.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.
                Username dan role hanya bisa diubah admin.
              </p>

              <Banner msg={profileMsg} />
              <div className="flex justify-end">
                <button type="submit" className={primaryBtn} disabled={savingProfile || !profileDirty}>
                  {savingProfile ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* Password */}
        <Card title="Ganti Password" description="Gunakan password yang panjang dan tidak dipakai di tempat lain.">
          <form onSubmit={savePassword} className="space-y-space-base" noValidate>
            <div className="flex flex-col gap-1">
              <label htmlFor="s-current" className={labelClass}>Password Saat Ini</label>
              <input id="s-current" type={pwType} className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="s-new" className={labelClass}>Password Baru</label>
              <input id="s-new" type={pwType} className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="s-confirm" className={labelClass}>Ulangi Password Baru</label>
              <input id="s-confirm" type={pwType} className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>

            <label className="flex items-center gap-2 text-label-md font-label-md text-on-surface-variant cursor-pointer select-none w-fit">
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
              Tampilkan password
            </label>

            <ul className="space-y-1 text-label-md font-label-md" aria-label="Syarat password">
              {[
                [checks.length, "Minimal 8 karakter"],
                [checks.different, "Berbeda dari password saat ini"],
                [checks.match, "Konfirmasi sama dengan password baru"],
              ].map(([ok, text]) => (
                <li key={text as string} className={`flex items-center gap-1.5 ${ok ? "text-tertiary" : "text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-[16px]">{ok ? "check_circle" : "radio_button_unchecked"}</span>
                  {text as string}
                </li>
              ))}
            </ul>

            <Banner msg={pwMsg} />
            <div className="flex justify-end">
              <button type="submit" className={primaryBtn} disabled={savingPw}>
                {savingPw ? "Menyimpan..." : "Ganti Password"}
              </button>
            </div>
          </form>
        </Card>

        {/* Tampilan */}
        <Card title="Tampilan" description="Pilihan ini hanya berlaku di browser ini.">
          <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-space-sm">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={theme === t.key}
                onClick={() => chooseTheme(t.key)}
                className={`rounded-lg border p-space-sm flex flex-col items-center gap-1 text-label-md font-label-md transition-colors ${
                  theme === t.key
                    ? "border-primary-container bg-primary-fixed/40 text-primary font-semibold"
                    : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Status layanan (admin) */}
        {profile?.role === "ADMIN" && (
          <Card title="Status Layanan" description="Pemeriksaan cepat database dan layanan OCR.">
            {!status ? (
              <p className="text-body-sm text-on-surface-variant">{checking ? "Memeriksa..." : "Status tidak bisa dimuat."}</p>
            ) : (
              <div className="space-y-space-base">
                <dl className="space-y-2 text-body-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-on-surface-variant">Database</dt>
                    <dd className={`font-semibold ${status.database.ok ? "text-tertiary" : "text-error"}`}>
                      {status.database.ok ? "Terhubung" : "Tidak terhubung"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-on-surface-variant">Layanan OCR</dt>
                    <dd className={`font-semibold text-right ${status.ocr.ok ? "text-tertiary" : "text-error"}`}>
                      {status.ocr.ok ? "Berjalan" : "Tidak berjalan"}
                    </dd>
                  </div>
                  {status.ocr.ok ? (
                    <p className="text-label-md font-label-md text-outline">
                      Tesseract {status.ocr.tesseract}, bahasa {status.ocr.lang}, PDF {status.ocr.pdf ? "didukung" : "tidak didukung"}.
                    </p>
                  ) : (
                    <p className="text-label-md font-label-md text-outline">
                      {status.ocr.message} Jalankan layanan di folder ocr_service (lihat README di dalamnya).
                    </p>
                  )}
                </dl>

                {status.warnings.length > 0 && (
                  <ul className="space-y-2" aria-label="Peringatan konfigurasi">
                    {status.warnings.map((w) => (
                      <li key={w} className="p-3 rounded border bg-error-container/60 border-error/30 text-on-error-container text-label-md font-label-md">
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end mt-space-base">
              <button
                type="button"
                onClick={checkSystem}
                disabled={checking}
                className="h-9 px-space-base rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-md font-label-md transition-colors disabled:opacity-50"
              >
                {checking ? "Memeriksa..." : "Periksa Ulang"}
              </button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}