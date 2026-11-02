"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, remember }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.message ?? "Email/username atau password salah.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error-container/80 p-3.5 animate-fadeIn"
        >
          <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
            error
          </span>
          <p className="font-label-md text-label-md text-on-error-container leading-relaxed">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Input: Email / Username */}
      <div className="space-y-1.5">
        <label
          className="block font-label-md text-label-md text-on-surface font-semibold"
          htmlFor="identifier"
        >
          Email / Username / NIP
        </label>
        <div className="relative flex items-center group">
          <span className="material-symbols-outlined absolute left-3.5 text-outline group-focus-within:text-primary transition-colors duration-150 pointer-events-none text-[20px]">
            account_circle
          </span>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="nama@kemenag.go.id atau NIP"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full h-11 pl-11 pr-3.5 bg-surface text-on-surface placeholder:text-outline border border-outline-variant rounded-xl hover:border-outline focus:border-primary focus:ring-4 focus:ring-primary/15 font-body-md text-body-md transition-all duration-200 outline-none"
          />
        </div>
      </div>

      {/* Input: Password */}
      <div className="space-y-1.5">
        <label
          className="block font-label-md text-label-md text-on-surface font-semibold"
          htmlFor="password"
        >
          Kata Sandi
        </label>
        <div className="relative flex items-center group">
          <span className="material-symbols-outlined absolute left-3.5 text-outline group-focus-within:text-primary transition-colors duration-150 pointer-events-none text-[20px]">
            key
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full h-11 pl-11 pr-11 bg-surface text-on-surface placeholder:text-outline border border-outline-variant rounded-xl hover:border-outline focus:border-primary focus:ring-4 focus:ring-primary/15 font-body-md text-body-md transition-all duration-200 outline-none ${
              showPassword ? "" : "tracking-widest"
            }`}
          />
          <button
            type="button"
            aria-label="Tampilkan atau sembunyikan password"
            title={showPassword ? "Sembunyikan password" : "Lihat password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 text-outline hover:text-on-surface p-1 rounded-lg focus:outline-none transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Ingat saya & lupa password */}
      <div className="flex items-center justify-between pt-1 text-label-md">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant accent-[#F96A0E] cursor-pointer"
          />
          <span className="text-on-surface-variant font-medium">
            Ingat Saya
          </span>
        </label>
        <a
          href="#help"
          className="text-primary font-semibold hover:underline transition-colors"
        >
          Lupa kata sandi?
        </a>
      </div>

      {/* Liquid Glass Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-liquid-glass w-full h-11 px-4 font-label-lg text-label-lg font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>{isSubmitting ? "Memverifikasi Kredensial..." : "Masuk ke Dashboard"}</span>
          {!isSubmitting && (
            <span className="material-symbols-outlined text-[19px]">login</span>
          )}
        </button>
      </div>
    </form>
  );
}