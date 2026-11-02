"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";

type Jemaah = {
  id: string;
  namaLengkap: string;
  binBinti: string | null;
  alamat: string | null;
  kecamatan: string | null;
  noTelepon: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  pernahHaji: string;
  pekerjaan: string | null;
  pendidikan: string | null;
  jenisKelamin: "L" | "P" | null;
  namaBank: string | null;
  noRekening: string | null;
  noValidasi: string | null;
  noPorsi: string | null;
  tanggalValidasi: string | null;
  tanggalPorsi: string | null;
};

type Filters = { q: string; pernahHaji: string; kecamatan: string; from: string; to: string };

const emptyFilters: Filters = { q: "", pernahHaji: "all", kecamatan: "", from: "", to: "" };

const PERNAH_HAJI_OPTIONS = ["Sudah", "Belum"];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Terjadi kesalahan.");
  return data as T;
}

/** Daftar nomor halaman dengan "..." di tengah */
function pageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
    result.push(p);
  });
  return result;
}

/** Parameter filter untuk /api/jemaah dan /api/jemaah/export */
function filterParams(f: Filters) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.pernahHaji !== "all") params.set("pernahHaji", f.pernahHaji);
  if (f.kecamatan) params.set("kecamatan", f.kecamatan);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  return params;
}

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "-");

const fieldClass =
  "w-full h-11 px-3.5 bg-surface rounded-xl border border-outline-variant text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none transition-all duration-150";

const labelClass = "text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant";

function StatusBadge({ status }: { status: string }) {
  const isSudah = status === "Sudah";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap shadow-xs ${
        isSudah
          ? "bg-tertiary/15 text-tertiary border-tertiary/30"
          : "bg-surface-container text-on-surface-variant border-outline-variant"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isSudah ? "bg-tertiary" : "bg-outline"}`} />
      {status}
    </span>
  );
}

function Field({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-outline">{label}</dt>
      <dd className={`text-body-sm font-medium text-on-surface break-words mt-0.5 ${mono ? "font-mono" : ""}`}>
        {dash(value)}
      </dd>
    </div>
  );
}

// useSearchParams wajib dibungkus Suspense di Next.js App Router
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";

  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [rows, setRows] = useState<Jemaah[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Stats calculation
  const [stats, setStats] = useState({
    sudahHaji: 0,
    belumHaji: 0,
  });

  useEffect(() => {
    setDraft((d) => (d.q === urlQ ? d : { ...d, q: urlQ }));
    setApplied((a) => (a.q === urlQ ? a : { ...a, q: urlQ }));
    setPage(1);
  }, [urlQ]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = filterParams(applied);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await api<{ data: Jemaah[]; total: number }>(`/api/jemaah?${params}`);
      setRows(res.data);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [applied, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api<{ kecamatan: string[] }>("/api/jemaah/kecamatan")
      .then((r) => setKecamatanOptions(r.kecamatan))
      .catch(() => {});
    api<{ user: { role: string } }>("/api/auth/me")
      .then((r) => setIsAdmin(r.user.role === "ADMIN"))
      .catch(() => {});
    api<{ ringkasan: { sudahHaji: number; belumHaji: number } }>("/api/laporan")
      .then((r) => setStats({ sudahHaji: r.ringkasan.sudahHaji, belumHaji: r.ringkasan.belumHaji }))
      .catch(() => {});
  }, []);

  function applyFilters(e?: FormEvent) {
    e?.preventDefault();
    setPage(1);
    setApplied(draft);
  }

  function resetFilters() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/jemaah/export?${filterParams(applied)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Gagal mengekspor data.");
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-jemaah-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal mengekspor data.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(j: Jemaah) {
    if (!window.confirm(`Hapus data "${j.namaLengkap}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api(`/api/jemaah/${j.id}`, { method: "DELETE" });
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus data.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startNo = total === 0 ? 0 : (page - 1) * limit + 1;
  const endNo = Math.min(page * limit, total);

  const activeFilterCount = [
    applied.q.trim() !== "",
    applied.pernahHaji !== "all",
    applied.kecamatan !== "",
    applied.from !== "",
    applied.to !== "",
  ].filter(Boolean).length;

  const emptyText = "Tidak ada berkas yang cocok dengan filter.";

  return (
    <main className="dashboard-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-surface-container-low p-3 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-6">
      {/* ===================================================================
          1. HEADER SECTION & ACTION BUTTONS
          =================================================================== */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-headline-lg text-on-surface tracking-tight">
            Data Rekapitulasi Jemaah
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Kelola, telusuri, dan verifikasi berkas pendaftaran jemaah haji &amp; umrah Kabupaten Magetan.
          </p>
        </div>

        {/* Action Buttons (Liquid Glass Styled) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || total === 0}
            title="Unduh data sesuai filter sebagai file Excel"
            className="btn-liquid-glass-secondary h-11 px-4 rounded-xl font-semibold text-label-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">
              table_view
            </span>
            <span>{exporting ? "Mengekspor..." : "Export Excel"}</span>
          </button>

          <Link
            href="/dashboard/input"
            className="btn-liquid-glass h-11 px-5 rounded-xl font-semibold text-label-md flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-white text-[20px]">
              add_circle
            </span>
            <span>Input Data</span>
          </Link>
        </div>
      </section>

      {/* ===================================================================
          2. KPI STATS OVERVIEW CARDS (Modern & Soft Design)
          =================================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Berkas */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFE8D6] to-[#FFD5B8] dark:from-[#3E1A00] dark:to-[#2A1100] text-primary flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline truncate">
              Total Berkas
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface font-headline-md leading-tight truncate mt-0.5">
              {total.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        {/* Card 2: Sudah Haji */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline truncate">
              Sudah Haji
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface font-headline-md leading-tight truncate mt-0.5">
              {(stats.sudahHaji || 0).toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        {/* Card 3: Belum Haji */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline truncate">
              Belum Berhaji
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface font-headline-md leading-tight truncate mt-0.5">
              {(stats.belumHaji || 0).toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        {/* Card 4: Kecamatan Terdaftar */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[24px]">location_on</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline truncate">
              Kecamatan
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface font-headline-md leading-tight truncate mt-0.5">
              {kecamatanOptions.length} Wilayah
            </h3>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. PENCARIAN & FILTER DI MENU DASHBOARD
          =================================================================== */}
      <form
        onSubmit={applyFilters}
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-200"
      >
        <button
          type="button"
          onClick={() => setShowFilters((open) => !open)}
          aria-expanded={showFilters}
          aria-controls="dashboard-filters"
          className={`w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-label-md font-semibold transition-colors ${
            showFilters || activeFilterCount > 0
              ? "bg-primary/10 border-primary/40 text-primary"
              : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[19px]">tune</span>
            <span>Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
            {showFilters ? "expand_less" : "expand_more"}
          </span>
        </button>

        <div
          id="dashboard-filters"
          className={
            showFilters
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4"
              : "hidden"
          }
        >
          {/* Kolom Pencarian Utama */}
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col gap-1.5">
            <label htmlFor="f-q" className={labelClass}>
              Pencarian Data Jemaah
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0 group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  id="f-q"
                  className={`${fieldClass} pl-11`}
                  placeholder="Cari nama lengkap, No. Porsi, No. Validasi, alamat..."
                  value={draft.q}
                  onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                />
                {draft.q && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, q: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Lanjutan */}
          <div className="contents">
            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <label htmlFor="f-status" className={labelClass}>
                Pernah Haji
              </label>
              <select
                id="f-status"
                className={`${fieldClass} cursor-pointer`}
                value={draft.pernahHaji}
                onChange={(e) => setDraft({ ...draft, pernahHaji: e.target.value })}
              >
                <option value="all">Semua Status</option>
                {PERNAH_HAJI_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <label htmlFor="f-kec" className={labelClass}>
                Kecamatan
              </label>
              <select
                id="f-kec"
                className={`${fieldClass} cursor-pointer`}
                value={draft.kecamatan}
                onChange={(e) => setDraft({ ...draft, kecamatan: e.target.value })}
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <label htmlFor="f-from" className={labelClass}>
                Validasi Dari
              </label>
              <input
                id="f-from"
                type="date"
                className={fieldClass}
                value={draft.from}
                onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <label htmlFor="f-to" className={labelClass}>
                Validasi Sampai
              </label>
              <input
                id="f-to"
                type="date"
                className={fieldClass}
                value={draft.to}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              />
            </div>
          </div>

          {/* Tombol Terapkan & Reset */}
          <div className="sm:col-span-2 lg:col-span-6 grid grid-cols-2 sm:flex sm:justify-end gap-2.5 lg:self-end">
            <button
              type="button"
              onClick={resetFilters}
              className="btn-liquid-glass-secondary h-11 px-4 rounded-xl font-semibold text-label-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Reset</span>
            </button>
            <button
              type="submit"
              className="btn-liquid-glass h-11 px-5 rounded-xl font-semibold text-label-md flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-white text-[18px]">filter_alt</span>
              <span>Terapkan</span>
            </button>
          </div>
        </div>

        {/* Info Pencarian & Hasil Filter */}
        <div className="pt-3 border-t border-outline-variant flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-on-surface-variant">
              Ditemukan <span className="font-bold text-primary">{total.toLocaleString("id-ID")}</span> berkas pendaftaran
            </span>
            {applied.q && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                Kata kunci: &quot;{applied.q}&quot;
              </span>
            )}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant text-label-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">sort</span>
            Urut: Tanggal Porsi &amp; Alamat
          </span>
        </div>
      </form>

      {/* ===================================================================
          4. DAFTAR DATA: MOBILE CARDS & DESKTOP TABLE
          =================================================================== */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
        {error && (
          <div className="m-4 p-4 rounded-xl bg-error-container/80 border border-error/30 text-on-error-container text-label-md font-semibold flex items-center gap-2.5">
            <span className="material-symbols-outlined text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* -----------------------------------------------------------------
            TAMPILAN MOBILE (Pembaruan Khusus Mobile View: Soft Cards)
            ----------------------------------------------------------------- */}
        <div className="md:hidden divide-y divide-outline-variant">
          {loading && (
            <div className="px-4 py-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
              <span className="text-label-md font-medium">Memuat data jemaah...</span>
            </div>
          )}

          {!loading && rows.length === 0 && !error && (
            <div className="px-4 py-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-outline text-4xl">folder_off</span>
              <p className="text-body-sm">{emptyText}</p>
            </div>
          )}

          {!loading &&
            rows.map((j, i) => (
              <article key={j.id} className="p-4 space-y-3 hover:bg-surface-container-low transition-colors duration-150">
                {/* Header Kartu */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {(page - 1) * limit + i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-on-surface text-base break-words leading-snug">
                        {j.namaLengkap}
                      </h3>
                      <p className="text-body-sm text-on-surface-variant break-words">
                        {dash(j.binBinti)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={j.pernahHaji} />
                </div>

                {/* Quick Tags / Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {j.noPorsi && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-outline-variant text-[11px] font-mono font-semibold text-on-surface">
                      <span className="text-outline">Porsi:</span> {j.noPorsi}
                    </span>
                  )}
                  {j.noValidasi && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-outline-variant text-[11px] font-mono text-primary font-semibold">
                      <span className="text-outline">Val:</span> {j.noValidasi}
                    </span>
                  )}
                  {j.kecamatan && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-outline-variant text-[11px] text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
                      {j.kecamatan}
                    </span>
                  )}
                </div>

                {/* Ringkasan Alamat & Kontak */}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 text-label-sm border-t border-outline-variant/60">
                  <Field label="No. Telepon" value={j.noTelepon} mono />
                  <Field label="Tgl Validasi" value={j.tanggalValidasi} />
                  <Field label="Alamat Lengkap" value={j.alamat} full />
                </dl>

                {/* Detail Lengkap Accordion */}
                <details className="group pt-1">
                  <summary className="cursor-pointer text-label-md font-semibold text-primary list-none flex items-center gap-1.5 select-none py-1">
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-open:rotate-90">
                      chevron_right
                    </span>
                    <span>Detail Lengkap Berkas</span>
                  </summary>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 p-3 rounded-xl bg-surface border border-outline-variant/60">
                    <Field label="Tempat Lahir" value={j.tempatLahir} />
                    <Field label="Tgl Lahir" value={j.tanggalLahir} />
                    <Field
                      label="Jenis Kelamin"
                      value={j.jenisKelamin === "L" ? "Laki-laki" : j.jenisKelamin === "P" ? "Perempuan" : null}
                    />
                    <Field label="Pendidikan" value={j.pendidikan} />
                    <Field label="Pekerjaan" value={j.pekerjaan} full />
                    <Field label="Nama Bank" value={j.namaBank} />
                    <Field label="No. Rekening" value={j.noRekening} mono />
                    <Field label="Tgl Porsi" value={j.tanggalPorsi} />
                  </dl>
                </details>

                {/* Tombol Aksi Admin */}
                {isAdmin && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDelete(j)}
                      className="h-8 px-3 rounded-lg border border-error/30 text-error hover:bg-error-container/40 text-label-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Hapus Berkas</span>
                    </button>
                  </div>
                )}
              </article>
            ))}
        </div>

        {/* -----------------------------------------------------------------
            TAMPILAN DESKTOP & TABLET: TABEL MODERN DENGAN STICKY HEADER
            ----------------------------------------------------------------- */}
        <div className="hidden md:block h-[min(60vh,720px)] min-h-[320px] overflow-auto overscroll-contain w-full">
          <table className="w-full text-left border-collapse text-body-sm whitespace-nowrap min-w-[2100px]">
            <thead className="sticky top-0 z-20">
              <tr className="h-11 bg-surface border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant select-none">
                <th className="px-3.5 sticky left-0 bg-surface z-10 w-12 text-center border-r border-outline-variant">
                  #
                </th>
                <th className="px-3.5 py-2.5 font-bold">1. Nama Lengkap</th>
                <th className="px-3.5 py-2.5 font-bold">2. Bin/Binti</th>
                <th className="px-3.5 py-2.5 font-bold">3. Alamat (RT/RW/Desa)</th>
                <th className="px-3.5 py-2.5 font-bold">4. Kecamatan</th>
                <th className="px-3.5 py-2.5 font-bold">5. No. Telepon</th>
                <th className="px-3.5 py-2.5 font-bold">6. Tempat Lahir</th>
                <th className="px-3.5 py-2.5 font-bold">7. Tgl Lahir</th>
                <th className="px-3.5 py-2.5 font-bold">8. Pernah Haji</th>
                <th className="px-3.5 py-2.5 font-bold">9. Pekerjaan</th>
                <th className="px-3.5 py-2.5 font-bold">10. Pendidikan</th>
                <th className="px-3.5 py-2.5 font-bold text-center">11. JK</th>
                <th className="px-3.5 py-2.5 font-bold">12. Nama Bank</th>
                <th className="px-3.5 py-2.5 font-bold">13. No. Rekening</th>
                <th className="px-3.5 py-2.5 font-bold">14. No. Validasi</th>
                <th className="px-3.5 py-2.5 font-bold">15. No. Porsi</th>
                <th className="px-3.5 py-2.5 font-bold">16. Tgl Validasi</th>
                <th className="px-3.5 py-2.5 font-bold">17. Tgl Porsi</th>
                <th className="px-3.5 py-2.5 font-bold sticky right-0 bg-surface z-10 text-center border-l border-outline-variant w-24">
                  18. Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading && (
                <tr>
                  <td colSpan={19} className="px-3.5 py-12 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span>Memuat data berkas...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={19} className="px-3.5 py-12 text-center text-on-surface-variant">
                    {emptyText}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((j, i) => (
                  <tr
                    key={j.id}
                    className="h-12 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-100 group"
                  >
                    <td className="px-3.5 text-center sticky left-0 bg-surface-container-lowest group-hover:bg-surface-container-low z-10 text-outline border-r border-outline-variant font-mono text-[11px]">
                      {(page - 1) * limit + i + 1}
                    </td>
                    <td className="px-3.5 py-2 font-semibold text-on-surface">{j.namaLengkap}</td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{dash(j.binBinti)}</td>
                    <td className="px-3.5 py-2 text-on-surface">{dash(j.alamat)}</td>
                    <td className="px-3.5 py-2 text-on-surface">{dash(j.kecamatan)}</td>
                    <td className="px-3.5 py-2 font-mono text-on-surface-variant">{dash(j.noTelepon)}</td>
                    <td className="px-3.5 py-2 text-on-surface">{dash(j.tempatLahir)}</td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{dash(j.tanggalLahir)}</td>
                    <td className="px-3.5 py-2">
                      <StatusBadge status={j.pernahHaji} />
                    </td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{dash(j.pekerjaan)}</td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{dash(j.pendidikan)}</td>
                    <td className="px-3.5 py-2 text-center">
                      {j.jenisKelamin ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            j.jenisKelamin === "L"
                              ? "bg-primary/10 text-primary"
                              : "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
                          }`}
                        >
                          {j.jenisKelamin}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-on-surface">{dash(j.namaBank)}</td>
                    <td className="px-3.5 py-2 font-mono text-outline">{dash(j.noRekening)}</td>
                    <td className="px-3.5 py-2 font-mono font-medium text-primary">{dash(j.noValidasi)}</td>
                    <td className="px-3.5 py-2 font-mono font-semibold text-on-surface">{dash(j.noPorsi)}</td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{dash(j.tanggalValidasi)}</td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{dash(j.tanggalPorsi)}</td>
                    <td className="px-3.5 py-2 sticky right-0 bg-surface-container-lowest group-hover:bg-surface-container-low z-10 text-center border-l border-outline-variant">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          disabled
                          className="p-1 rounded text-outline opacity-40 cursor-not-allowed"
                          title="Edit berkas"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(j)}
                            className="p-1 rounded hover:bg-error-container text-outline hover:text-error transition-colors"
                            title="Hapus data"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* -----------------------------------------------------------------
            PAGINASI (Modern & Sleek)
            ----------------------------------------------------------------- */}
        <div className="p-3.5 sm:p-4 bg-surface border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="text-body-sm text-on-surface-variant">
            Menampilkan{" "}
            <span className="font-bold text-on-surface">
              {startNo}-{endNo}
            </span>{" "}
            dari <span className="font-bold text-primary">{total.toLocaleString("id-ID")}</span> berkas
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-label-sm text-on-surface-variant font-medium">
                Baris:
              </span>
              <select
                aria-label="Baris per halaman"
                className="h-9 px-2.5 bg-surface-container-lowest text-on-surface rounded-xl border border-outline-variant text-label-sm font-semibold focus:border-primary focus:outline-none"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <nav aria-label="Paginasi" className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
                className="h-9 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:border-primary/40 text-label-sm font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">chevron_left</span>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Mobile text paginasi */}
              <span className="sm:hidden px-2 text-label-md font-bold text-on-surface-variant whitespace-nowrap">
                {page} / {totalPages}
              </span>

              {/* Desktop pagination buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {pageList(page, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-1 text-outline font-bold">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={
                        p === page
                          ? "btn-liquid-glass h-9 w-9 rounded-xl font-bold text-label-sm flex items-center justify-center shadow-xs"
                          : "h-9 w-9 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:border-primary/40 font-semibold text-label-sm flex items-center justify-center transition-all"
                      }
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="Halaman berikutnya"
                className="h-9 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:border-primary/40 text-label-sm font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="material-symbols-outlined text-[17px]">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </section>
    </main>
  );
}