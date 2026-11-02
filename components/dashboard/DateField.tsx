"use client";

export { toIso, normalizeDate };

/** "dd/mm/yyyy" atau berbagai format lain → "yyyy-mm-dd" (format HTML date input). */
function toIso(input: string): string | null {
  if (!input || !input.trim()) return null;
  const s = input.trim();

  // Sudah ISO: yyyy-mm-dd
  const isoM = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoM) return s;

  // Bulan nama Indonesia
  const MONTHS: Record<string, number> = {
    januari: 1, jan: 1, februari: 2, pebruari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4,
    mei: 5, juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, agt: 8, ags: 8,
    september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nopember: 11, nov: 11,
    desember: 12, des: 12,
  };

  const pad = (n: number) => String(n).padStart(2, "0");
  const fullYear = (t: string) => { const y = Number(t); return t.length === 2 ? y + (y <= 30 ? 2000 : 1900) : y; };

  function buildIso(day: number, month: number, year: number): string | null {
    const d = new Date(Date.UTC(year, month - 1, day));
    const ok = d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
    return ok && year >= 1900 && year <= 2100 ? `${year}-${pad(month)}-${pad(day)}` : null;
  }

  let m = s.match(/^(\d{1,2})[\s./-]*([A-Za-z]{3,10})\.?[\s,./-]*(\d{4}|\d{2})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? buildIso(Number(m[1]), month, fullYear(m[3])) : null;
  }
  m = s.match(/^(\d{1,2})[\s./-]+(\d{1,2})[\s./-]+(\d{4}|\d{2})$/);
  if (m) return buildIso(Number(m[1]), Number(m[2]), fullYear(m[3]));
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return buildIso(Number(m[3]), Number(m[2]), Number(m[1]));
  m = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m) return buildIso(Number(m[1]), Number(m[2]), Number(m[3]));

  return null;
}

/**
 * Normalise tampilan → format ISO "yyyy-mm-dd".
 * Mengembalikan "" kalau kosong dan null kalau bukan tanggal yang valid.
 * (Dipertahankan agar kompatibel dengan kode yang sudah ada.)
 */
function normalizeDate(input: string): string | null {
  if (!input || !input.trim()) return "";
  return toIso(input);
}

export default function DateField({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      className={className}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}