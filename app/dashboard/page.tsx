"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

const STATUS_STYLE: Record<string, string> = {
  Sudah: "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim",
  Belum: "bg-surface-container-highest text-on-surface-variant border-outline-variant",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include", ...init });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Terjadi kesalahan.");
  return data as T;
}

/** Daftar nomor halaman dengan "..." di tengah, mis. [1, "...", 4, 5, 6, "...", 20] */
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
  "w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none";

const labelClass = "text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
        STATUS_STYLE[status] ?? STATUS_STYLE.Belum
      }`}
    >
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
      <dt className="text-label-sm font-label-sm uppercase tracking-wide text-outline">{label}</dt>
      <dd className={`text-body-sm text-on-surface break-words ${mono ? "font-mono" : ""}`}>{dash(value)}</dd>
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
  const [showFilters, setShowFilters] = useState(false); // hanya berpengaruh di mobile
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [rows, setRows] = useState<Jemaah[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Sinkronkan pencarian dari kolom cari di Topbar (?q=...)
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
      // Ekspor semua data yang cocok dengan filter yang sedang diterapkan (bukan hanya halaman ini)
      const res = await fetch(`${API_URL}/api/jemaah/export?${filterParams(applied)}`, {
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
      // Kalau yang dihapus satu-satunya baris di halaman ini, mundur satu halaman
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus data.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startNo = total === 0 ? 0 : (page - 1) * limit + 1;
  const endNo = Math.min(page * limit, total);

  // Jumlah filter lanjutan yang aktif (untuk badge di tombol "Filter" mobile)
  const activeAdvanced = [
    applied.pernahHaji !== "all",
    applied.kecamatan !== "",
    applied.from !== "",
    applied.to !== "",
  ].filter(Boolean).length;

  const emptyText = "Tidak ada data yang cocok dengan filter.";

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col gap-space-lg">
      {/* Judul + aksi */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-base">
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface">
            Data Rekapitulasi Jemaah
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Kelola dan rekapitulasi berkas pendaftaran jemaah haji &amp; umrah.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-space-sm">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || total === 0}
            title="Unduh data yang sedang ditampilkan (sesuai filter) sebagai Excel"
            className="h-10 px-space-base rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container hover:border-outline transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-tertiary">table_view</span>
            <span>{exporting ? "Mengekspor..." : "Export Excel"}</span>
          </button>
          <Link
            href="/dashboard/input"
            className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-primary transition-colors duration-150 shadow-sm"
          >
            <span className="material-symbols-outlined text-on-primary">add</span>
            <span>Input Data</span>
          </Link>
        </div>
      </section>

      {/* Pencarian & filter */}
      <form
        onSubmit={applyFilters}
        className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-base shadow-sm space-y-space-base"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-space-base">
          {/* Pencarian + tombol Filter (mobile) */}
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col gap-1">
            <label htmlFor="f-q" className={labelClass}>
              Pencarian
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                  search
                </span>
                <input
                  id="f-q"
                  className={`${fieldClass} pl-9`}
                  placeholder="Nama, alamat, No. Porsi..."
                  value={draft.q}
                  onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
                className="md:hidden h-10 px-3 rounded-lg border border-outline-variant bg-surface text-on-surface-variant flex items-center gap-1 text-label-md font-label-md shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Filter</span>
                {activeAdvanced > 0 && (
                  <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center">
                    {activeAdvanced}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter lanjutan: selalu tampil di md ke atas, bisa dibuka-tutup di mobile */}
          <div className={showFilters ? "contents" : "hidden md:contents"}>
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label htmlFor="f-status" className={labelClass}>
                Pernah Haji
              </label>
              <select
                id="f-status"
                className={`${fieldClass} cursor-pointer`}
                value={draft.pernahHaji}
                onChange={(e) => setDraft({ ...draft, pernahHaji: e.target.value })}
              >
                <option value="all">Semua</option>
                {PERNAH_HAJI_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-1">
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

            <div className="lg:col-span-3 flex flex-col gap-1">
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

            <div className="lg:col-span-3 flex flex-col gap-1">
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

          {/* Tombol aksi */}
          <div className="sm:col-span-2 lg:col-span-6 grid grid-cols-2 sm:flex sm:justify-end gap-space-sm lg:self-end">
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 px-space-base rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors duration-150"
            >
              Reset
            </button>
            <button
              type="submit"
              className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-1 hover:bg-primary transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              <span>Terapkan</span>
            </button>
          </div>
        </div>

        <div className="pt-space-sm border-t border-outline-variant flex items-center justify-between gap-2 flex-wrap">
          <span className="text-label-md font-label-md text-on-surface-variant">
            Ditemukan <span className="font-semibold text-on-surface">{total.toLocaleString("id-ID")}</span> berkas
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[15px] text-primary">sort</span>
            Urut: Tanggal Validasi &amp; Alamat
          </span>
        </div>
      </form>

      {/* Data */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {error && (
          <div className="m-space-base p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md">
            {error}
          </div>
        )}

        {/* Mobile: daftar kartu */}
        <div className="md:hidden divide-y divide-outline-variant">
          {loading && <div className="px-4 py-10 text-center text-on-surface-variant">Memuat data...</div>}
          {!loading && rows.length === 0 && !error && (
            <div className="px-4 py-10 text-center text-on-surface-variant">{emptyText}</div>
          )}
          {!loading &&
            rows.map((j, i) => (
              <article key={j.id} className="p-space-base space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-outline">#{(page - 1) * limit + i + 1}</p>
                    <h3 className="font-semibold text-on-surface break-words">{j.namaLengkap}</h3>
                    <p className="text-label-md font-label-md text-on-surface-variant break-words">
                      {dash(j.binBinti)}
                    </p>
                  </div>
                  <StatusBadge status={j.pernahHaji} />
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <Field label="No. Porsi" value={j.noPorsi} mono />
                  <Field label="No. Validasi" value={j.noValidasi} mono />
                  <Field label="Tgl Validasi" value={j.tanggalValidasi} />
                  <Field label="No. Telepon" value={j.noTelepon} mono />
                  <Field label="Alamat" value={j.alamat} full />
                  <Field label="Kecamatan" value={j.kecamatan} full />
                </dl>

                <details className="group">
                  <summary className="cursor-pointer text-label-md font-label-md font-semibold text-primary list-none flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] transition-transform group-open:rotate-90">
                      chevron_right
                    </span>
                    Detail lengkap
                  </summary>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
                    <Field label="Tempat Lahir" value={j.tempatLahir} />
                    <Field label="Tgl Lahir" value={j.tanggalLahir} />
                    <Field label="Jenis Kelamin" value={j.jenisKelamin === "L" ? "Laki-laki" : j.jenisKelamin === "P" ? "Perempuan" : null} />
                    <Field label="Pendidikan" value={j.pendidikan} />
                    <Field label="Pekerjaan" value={j.pekerjaan} full />
                    <Field label="Nama Bank" value={j.namaBank} />
                    <Field label="No. Rekening" value={j.noRekening} mono />
                    <Field label="Tgl Porsi" value={j.tanggalPorsi} />
                  </dl>
                </details>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(j)}
                    className="h-9 px-3 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:bg-error-container/40 text-label-md font-label-md flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Hapus
                  </button>
                )}
              </article>
            ))}
        </div>

        {/* Tablet & desktop: tabel lebar */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-body-sm whitespace-nowrap min-w-[2100px]">
            <thead>
              <tr className="h-10 bg-surface border-b border-outline-variant text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="px-3.5 sticky left-0 bg-surface z-10 w-12 text-center border-r border-outline-variant">#</th>
                <th className="px-3.5 py-2 font-semibold">1. Nama Lengkap</th>
                <th className="px-3.5 py-2 font-semibold">2. Bin/Binti</th>
                <th className="px-3.5 py-2 font-semibold">3. Alamat (RT/RW/Desa)</th>
                <th className="px-3.5 py-2 font-semibold">4. Kecamatan</th>
                <th className="px-3.5 py-2 font-semibold">5. No. Telepon</th>
                <th className="px-3.5 py-2 font-semibold">6. Tempat Lahir</th>
                <th className="px-3.5 py-2 font-semibold">7. Tgl Lahir</th>
                <th className="px-3.5 py-2 font-semibold">8. Pernah Haji</th>
                <th className="px-3.5 py-2 font-semibold">9. Pekerjaan</th>
                <th className="px-3.5 py-2 font-semibold">10. Pendidikan</th>
                <th className="px-3.5 py-2 font-semibold text-center">11. JK</th>
                <th className="px-3.5 py-2 font-semibold">12. Nama Bank</th>
                <th className="px-3.5 py-2 font-semibold">13. No. Rekening</th>
                <th className="px-3.5 py-2 font-semibold">14. No. Validasi</th>
                <th className="px-3.5 py-2 font-semibold">15. No. Porsi</th>
                <th className="px-3.5 py-2 font-semibold">16. Tgl Validasi</th>
                <th className="px-3.5 py-2 font-semibold">17. Tgl Porsi</th>
                <th className="px-3.5 py-2 font-semibold sticky right-0 bg-surface z-10 text-center border-l border-outline-variant w-24">
                  18. Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading && (
                <tr>
                  <td colSpan={19} className="px-3.5 py-10 text-center text-on-surface-variant">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={19} className="px-3.5 py-10 text-center text-on-surface-variant">
                    {emptyText}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((j, i) => (
                  <tr key={j.id} className="h-12 hover:bg-surface-container-low transition-colors duration-100 group">
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
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            j.jenisKelamin === "L"
                              ? "bg-surface-container text-primary"
                              : "bg-error-container text-on-error-container"
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
                          title="Edit tersedia setelah form input dibuat"
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

        {/* Paginasi */}
        <div className="p-space-base bg-surface border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm select-none">
          <div className="text-body-sm font-body-sm text-on-surface-variant">
            Menampilkan{" "}
            <span className="font-semibold text-on-surface">
              {startNo}-{endNo}
            </span>{" "}
            dari <span className="font-semibold text-on-surface">{total.toLocaleString("id-ID")}</span> data
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-space-base flex-wrap">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-label-sm font-label-sm text-on-surface-variant">
                Baris per halaman:
              </span>
              <select
                aria-label="Baris per halaman"
                className="h-8 px-2 bg-surface-container-lowest text-on-surface rounded border border-outline-variant text-label-sm font-label-sm focus:border-primary-container focus:outline-none"
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
                className="h-8 px-2.5 rounded border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container text-label-sm font-label-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Mobile: cukup "Hal 2 / 10" */}
              <span className="sm:hidden px-2 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">
                Hal {page} / {totalPages}
              </span>

              {/* sm ke atas: nomor halaman */}
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
                          ? "h-8 w-8 rounded bg-primary-container text-on-primary font-bold text-label-sm font-label-sm flex items-center justify-center shadow-sm"
                          : "h-8 w-8 rounded border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container font-medium text-label-sm font-label-sm flex items-center justify-center transition-colors"
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
                className="h-8 px-2.5 rounded border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container text-label-sm font-label-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </section>
    </main>
  );
}