"use client";

import { useState } from "react";

type Row = { kecamatan: string; total: number; laki: number; perempuan: number; sudah: number; belum: number };
type Mode = "jk" | "haji" | "total";
type Segment = { label: string; short: string; value: number; color: string };

const MODES: { key: Mode; label: string }[] = [
  { key: "jk", label: "Jenis Kelamin" },
  { key: "haji", label: "Status Haji" },
  { key: "total", label: "Total" },
];

const TOP = 10;

const fmt = (n: number) => n.toLocaleString("id-ID");
const percent = (n: number, total: number) =>
  total ? `${((n / total) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%` : "0%";

function segmentsOf(row: Row, mode: Mode): Segment[] {
  if (mode === "jk") {
    const rest = row.total - row.laki - row.perempuan; // jenis kelamin yang belum diisi
    return [
      { label: "Laki-laki", short: "L", value: row.laki, color: "bg-primary-container" },
      { label: "Perempuan", short: "P", value: row.perempuan, color: "bg-tertiary-fixed-dim" },
      ...(rest > 0 ? [{ label: "Tidak diisi", short: "?", value: rest, color: "bg-outline" }] : []),
    ];
  }
  if (mode === "haji") {
    return [
      { label: "Sudah haji", short: "Sudah", value: row.sudah, color: "bg-tertiary-fixed-dim" },
      { label: "Belum haji", short: "Belum", value: row.belum, color: "bg-primary-container" },
    ];
  }
  return [{ label: "Total", short: "", value: row.total, color: "bg-primary-container" }];
}

export default function KecamatanChart({ rows }: { rows: Row[] }) {
  const [mode, setMode] = useState<Mode>("jk");
  const [showAll, setShowAll] = useState(false);

  if (rows.length === 0) return null;

  const shown = showAll ? rows : rows.slice(0, TOP);
  const max = Math.max(1, ...shown.map((r) => r.total)); // skala sama untuk semua batang

  // Legenda: jumlah keseluruhan semua kecamatan
  const sum = rows.reduce(
    (a, r) => ({
      kecamatan: "",
      total: a.total + r.total,
      laki: a.laki + r.laki,
      perempuan: a.perempuan + r.perempuan,
      sudah: a.sudah + r.sudah,
      belum: a.belum + r.belum,
    }),
    { kecamatan: "", total: 0, laki: 0, perempuan: 0, sudah: 0, belum: 0 }
  );
  const legend = segmentsOf(sum, mode).filter((s) => s.value > 0);

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div>
          <h2 className="text-title-md font-title-md text-on-surface">Grafik per Kecamatan</h2>
          <p className="text-label-md font-label-md text-outline">
            Panjang batang dibandingkan antar kecamatan, diurutkan dari yang terbanyak.
          </p>
        </div>

        <div role="group" aria-label="Pembagian batang" className="inline-flex rounded-lg border border-outline-variant overflow-hidden self-start">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={mode === m.key}
              onClick={() => setMode(m.key)}
              className={`h-9 px-3 text-label-md font-label-md transition-colors ${
                mode === m.key
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-label-md font-label-md text-on-surface-variant" aria-label="Keterangan warna">
        {legend.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm ${s.color}`} aria-hidden="true" />
            {s.label} <span className="font-semibold text-on-surface">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>

      {/* Batang */}
      <ul className="mt-4 space-y-3">
        {shown.map((r) => {
          const segs = segmentsOf(r, mode);
          const detail = segs
            .filter((s) => s.value > 0 && s.short)
            .map((s) => `${fmt(s.value)} ${s.short}`)
            .join(" · ");
          return (
            <li key={r.kecamatan}>
              <div className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="text-on-surface break-words min-w-0">{r.kecamatan}</span>
                <span className="text-on-surface-variant whitespace-nowrap">
                  <span className="font-semibold text-on-surface">{fmt(r.total)}</span>
                  {detail && <span className="text-label-md"> ({detail})</span>}
                </span>
              </div>
              <div
                role="img"
                aria-label={`${r.kecamatan}: ${fmt(r.total)} jemaah${detail ? ` (${detail})` : ""}`}
                className="mt-1 h-5 rounded bg-surface-container-highest overflow-hidden flex"
              >
                {segs.map(
                  (s) =>
                    s.value > 0 && (
                      <div
                        key={s.label}
                        className={`${s.color} h-full border-r border-surface-container-lowest last:border-r-0`}
                        style={{ width: `${Math.round((s.value / max) * 10000) / 100}%` }}
                        title={`${r.kecamatan} - ${s.label}: ${fmt(s.value)} (${percent(s.value, r.total)})`}
                      />
                    )
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {rows.length > TOP && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-label-md font-label-md font-semibold text-primary hover:underline"
        >
          {showAll ? `Tampilkan ${TOP} teratas saja` : `Tampilkan semua (${rows.length} kecamatan)`}
        </button>
      )}
    </section>
  );
}