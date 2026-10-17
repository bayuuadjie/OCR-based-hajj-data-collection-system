"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import KecamatanChart from "@/components/dashboard/KecamatanChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CountRow = { label: string; total: number };

type Laporan = {
  periode: { from: string | null; to: string | null };
  ringkasan: {
    total: number;
    laki: number;
    perempuan: number;
    sudahHaji: number;
    belumHaji: number;
    tanpaValidasi: number;
  };
  perKecamatan: { kecamatan: string; total: number; laki: number; perempuan: number; sudah: number; belum: number }[];
  perBulan: { bulan: string; total: number }[];
  usia: CountRow[];
  pendidikan: CountRow[];
  pekerjaan: CountRow[];
  bank: CountRow[];
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const monthLabel = (bulan: string) => {
  const [y, m] = bulan.split("-");
  return `${MONTHS_SHORT[Number(m) - 1] ?? m} ${y.slice(2)}`;
};

const fmt = (n: number) => n.toLocaleString("id-ID");
const percent = (n: number, total: number) =>
  total ? `${((n / total) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%` : "0%";

const isoToId = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function periodText(from: string, to: string) {
  if (from && to) return `${isoToId(from)} s.d. ${isoToId(to)}`;
  if (from) return `Mulai ${isoToId(from)}`;
  if (to) return `Sampai ${isoToId(to)}`;
  return "Semua periode";
}

const fieldClass =
  "w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none";

function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base flex items-start gap-3">
      <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">{label}</p>
        <p className="text-headline-md font-headline-md text-on-surface leading-tight">{value}</p>
        {hint && <p className="text-label-md font-label-md text-outline">{hint}</p>}
      </div>
    </div>
  );
}

function BarList({ title, rows, total, note }: { title: string; rows: CountRow[]; total: number; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base">
      <h3 className="text-title-md font-title-md text-on-surface">{title}</h3>
      {note && <p className="text-label-md font-label-md text-outline">{note}</p>}
      {rows.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant mt-3">Belum ada data.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="text-on-surface break-words min-w-0">{r.label}</span>
                <span className="text-on-surface-variant whitespace-nowrap">
                  <span className="font-semibold text-on-surface">{fmt(r.total)}</span> ({percent(r.total, total)})
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full rounded-full bg-primary-container" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function LaporanPage() {
  const [draft, setDraft] = useState({ from: "", to: "" });
  const [applied, setApplied] = useState({ from: "", to: "" });
  const [data, setData] = useState<Laporan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = useCallback(() => {
    const params = new URLSearchParams();
    if (applied.from) params.set("from", applied.from);
    if (applied.to) params.set("to", applied.to);
    return params.toString();
  }, [applied]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/laporan?${query()}`, { credentials: "include" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? "Gagal memuat laporan.");
      setData(json as Laporan);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  function apply(e?: FormEvent) {
    e?.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setError("Tanggal 'dari' tidak boleh setelah tanggal 'sampai'.");
      return;
    }
    setApplied(draft);
  }

  function reset() {
    setDraft({ from: "", to: "" });
    setApplied({ from: "", to: "" });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/api/laporan/export?${query()}`, { credentials: "include" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message ?? "Gagal mengekspor laporan.");
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-jemaah-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal mengekspor laporan.");
    } finally {
      setExporting(false);
    }
  }

  const r = data?.ringkasan;
  const maxBulan = Math.max(1, ...(data?.perBulan.map((b) => b.total) ?? [0]));
  const maxKec = Math.max(1, ...(data?.perKecamatan.map((k) => k.total) ?? [0]));

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col gap-space-lg">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-base">
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface">
            Laporan Rekapitulasi Jemaah
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Periode tanggal validasi: <span className="font-semibold text-on-surface">{periodText(applied.from, applied.to)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !r || r.total === 0}
          className="h-10 px-space-base rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container hover:border-outline transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-tertiary">table_view</span>
          <span>{exporting ? "Mengekspor..." : "Export Excel"}</span>
        </button>
      </section>

      {/* Filter periode */}
      <form
        onSubmit={apply}
        className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-base shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-space-base"
      >
        <div className="lg:col-span-3 flex flex-col gap-1">
          <label htmlFor="l-from" className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">
            Validasi Dari
          </label>
          <input id="l-from" type="date" className={fieldClass} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </div>
        <div className="lg:col-span-3 flex flex-col gap-1">
          <label htmlFor="l-to" className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">
            Validasi Sampai
          </label>
          <input id="l-to" type="date" className={fieldClass} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </div>
        <div className="sm:col-span-2 lg:col-span-6 grid grid-cols-2 sm:flex sm:justify-end gap-space-sm lg:self-end">
          <button
            type="button"
            onClick={reset}
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
      </form>

      {error && (
        <div role="alert" className="p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md">
          {error}
        </div>
      )}

      {loading && !data && <p className="text-body-md text-on-surface-variant">Memuat laporan...</p>}

      {data && r && (
        <>
          {r.total === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-space-lg text-center text-on-surface-variant">
              Tidak ada data jemaah pada periode ini.
            </div>
          ) : (
            <>
              {/* Ringkasan */}
              <section className={`grid grid-cols-2 lg:grid-cols-5 gap-space-base ${loading ? "opacity-60" : ""}`}>
                <StatCard label="Total Jemaah" value={fmt(r.total)} icon="groups" hint={r.tanpaValidasi > 0 ? `${fmt(r.tanpaValidasi)} belum divalidasi` : undefined} />
                <StatCard label="Laki-laki" value={fmt(r.laki)} icon="man" hint={percent(r.laki, r.total)} />
                <StatCard label="Perempuan" value={fmt(r.perempuan)} icon="woman" hint={percent(r.perempuan, r.total)} />
                <StatCard label="Sudah Haji" value={fmt(r.sudahHaji)} icon="verified" hint={percent(r.sudahHaji, r.total)} />
                <StatCard label="Belum Haji" value={fmt(r.belumHaji)} icon="hourglass_top" hint={percent(r.belumHaji, r.total)} />
              </section>

              {/* Grafik per kecamatan */}
              <KecamatanChart rows={data.perKecamatan} />

              {/* Per kecamatan */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="p-space-base border-b border-outline-variant">
                  <h2 className="text-title-md font-title-md text-on-surface">Rekap per Kecamatan</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-body-sm whitespace-nowrap">
                    <thead>
                      <tr className="h-10 bg-surface border-b border-outline-variant text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                        <th className="px-3.5 py-2 font-semibold">Kecamatan</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Total</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Laki-laki</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Perempuan</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Sudah Haji</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Belum Haji</th>
                        <th className="px-3.5 py-2 font-semibold min-w-[140px]">Porsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {data.perKecamatan.map((k) => (
                        <tr key={k.kecamatan} className="h-11 hover:bg-surface-container-low transition-colors">
                          <td className="px-3.5 py-2 font-semibold text-on-surface">{k.kecamatan}</td>
                          <td className="px-3.5 py-2 text-right font-semibold text-on-surface">{fmt(k.total)}</td>
                          <td className="px-3.5 py-2 text-right text-on-surface-variant">{fmt(k.laki)}</td>
                          <td className="px-3.5 py-2 text-right text-on-surface-variant">{fmt(k.perempuan)}</td>
                          <td className="px-3.5 py-2 text-right text-on-surface-variant">{fmt(k.sudah)}</td>
                          <td className="px-3.5 py-2 text-right text-on-surface-variant">{fmt(k.belum)}</td>
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 rounded-full bg-surface-container-highest overflow-hidden">
                                <div className="h-full rounded-full bg-primary-container" style={{ width: `${(k.total / maxKec) * 100}%` }} />
                              </div>
                              <span className="text-label-md text-outline w-12 text-right">{percent(k.total, r.total)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="h-11 bg-surface border-t border-outline-variant font-bold text-on-surface">
                        <td className="px-3.5 py-2">Total</td>
                        <td className="px-3.5 py-2 text-right">{fmt(data.perKecamatan.reduce((a, k) => a + k.total, 0))}</td>
                        <td className="px-3.5 py-2 text-right">{fmt(data.perKecamatan.reduce((a, k) => a + k.laki, 0))}</td>
                        <td className="px-3.5 py-2 text-right">{fmt(data.perKecamatan.reduce((a, k) => a + k.perempuan, 0))}</td>
                        <td className="px-3.5 py-2 text-right">{fmt(data.perKecamatan.reduce((a, k) => a + k.sudah, 0))}</td>
                        <td className="px-3.5 py-2 text-right">{fmt(data.perKecamatan.reduce((a, k) => a + k.belum, 0))}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Per bulan validasi */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base">
                <h2 className="text-title-md font-title-md text-on-surface">Jumlah Validasi per Bulan</h2>
                {data.perBulan.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant mt-3">Belum ada data tanggal validasi.</p>
                ) : (
                  <div className="overflow-x-auto mt-3">
                    <div className="flex items-end gap-2 h-56 min-w-max pt-2">
                      {data.perBulan.map((b) => (
                        <div key={b.bulan} className="flex flex-col justify-end items-center w-11 h-full" title={`${b.bulan}: ${fmt(b.total)}`}>
                          <span className="text-label-md font-label-md text-on-surface h-5">{b.total > 0 ? fmt(b.total) : ""}</span>
                          <div
                            className="w-full rounded-t bg-primary-container"
                            style={{ height: `calc((100% - 2.75rem) * ${b.total / maxBulan})`, minHeight: b.total > 0 ? 2 : 0 }}
                          />
                          <span className="text-label-sm font-label-sm text-on-surface-variant mt-1 h-5 whitespace-nowrap">{monthLabel(b.bulan)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Sebaran */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
                <BarList title="Kelompok Usia" rows={data.usia} total={r.total} note="Usia dihitung dari tanggal lahir sampai hari ini." />
                <BarList title="Pendidikan" rows={data.pendidikan} total={r.total} note="10 teratas." />
                <BarList title="Pekerjaan" rows={data.pekerjaan} total={r.total} note="10 teratas." />
                <BarList title="Bank" rows={data.bank} total={r.total} note="10 teratas." />
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}