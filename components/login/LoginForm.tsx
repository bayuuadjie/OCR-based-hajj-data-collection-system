"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
      const response = await fetch(`${API_URL}/api/auth/login`, {
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
          className="flex items-start gap-2.5 rounded border border-error/30 bg-error-container/60 p-3"
        >
          <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
            error
          </span>
          <p className="font-label-md text-label-md text-on-error-container leading-relaxed">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Input: Email / Username */}
      <div>
        <label
          className="block font-label-md text-label-md text-on-surface font-semibold mb-1.5"
          htmlFor="identifier"
        >
          Email / Username
        </label>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant pointer-events-none">
            account_circle
          </span>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="example@mail.com atau NIP"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full h-10 pl-10 pr-3 bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant rounded hover:border-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 font-body-md text-body-md transition-colors"
          />
        </div>
      </div>

      {/* Input: Password */}
      <div>
        <label
          className="block font-label-md text-label-md text-on-surface font-semibold mb-1.5"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant pointer-events-none">
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
            className={`w-full h-10 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant rounded hover:border-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 font-body-md text-body-md transition-colors ${
              showPassword ? "" : "tracking-widest"
            }`}
          />
          <button
            type="button"
            aria-label="Tampilkan atau sembunyikan password"
            title="Tampilkan atau sembunyikan password"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 text-on-surface-variant hover:text-on-surface p-1 rounded focus:outline-none transition-colors"
          >
            <span className="material-symbols-outlined">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Ingat saya & lupa password */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container/20 bg-surface-container-lowest cursor-pointer"
          />
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Ingat Saya
          </span>
        </label>
        <a
          href="/reset-password"
          className="font-label-md text-label-md text-primary font-semibold hover:underline transition-all"
        >
          Lupa kata sandi?
        </a>
      </div>

      <div className="pt-2 space-y-2.5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 px-4 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-semibold rounded flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-150 focus:ring-2 focus:ring-primary-fixed focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{isSubmitting ? "Memproses..." : "Masuk ke Dashboard"}</span>
          {!isSubmitting && (
            <span className="material-symbols-outlined text-lg">login</span>
          )}
        </button>
      </div>
    </form>
  );
}