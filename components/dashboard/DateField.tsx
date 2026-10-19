"use client";

const MONTHS: Record<string, number> = {
  januari: 1, jan: 1, februari: 2, pebruari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4,
  mei: 5, juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, agt: 8, ags: 8,
  september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nopember: 11, nov: 11,
  desember: 12, des: 12,
};

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function build(day: number, month: number, year: number): string | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  const real = d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  return real && year >= 1900 && year <= 2100 ? `${pad(day)}/${pad(month)}/${year}` : null;
}

function fullYear(text: string): number {
  const y = Number(text);
  return text.length === 2 ? y + (y <= 30 ? 2000 : 1900) : y;
}

/**
 * "7 Juni 2022", "07-06-2022", "7.6.22", "2022-06-07", "07062022" -> "07/06/2022".
 * Mengembalikan "" kalau kosong dan null kalau bukan tanggal yang valid.
 */
export function normalizeDate(input: string): string | null {
  const s = input.trim();
  if (!s) return "";

  let m = s.match(/^(\d{1,2})[\s./-]*([A-Za-z]{3,10})\.?[\s,./-]*(\d{4}|\d{2})$/); // 7 Juni 2022
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? build(Number(m[1]), month, fullYear(m[3])) : null;
  }
  m = s.match(/^(\d{1,2})[\s./-]+(\d{1,2})[\s./-]+(\d{4}|\d{2})$/); // 07/06/2022
  if (m) return build(Number(m[1]), Number(m[2]), fullYear(m[3]));
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); // 2022-06-07
  if (m) return build(Number(m[3]), Number(m[2]), Number(m[1]));
  m = s.match(/^(\d{2})(\d{2})(\d{4})$/); // 07062022
  if (m) return build(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

/** "07/06/2022" (atau bentuk lain yang dikenali) -> "2022-06-07" untuk dikirim ke server. */
export function toIso(input: string): string | null {
  const n = normalizeDate(input);
  if (!n) return null;
  const [d, m, y] = n.split("/");
  return `${y}-${m}-${d}`;
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
  const invalid = value.trim() !== "" && normalizeDate(value) === null;

  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        value={value}
        aria-invalid={invalid}
        className={`${className} ${invalid ? "!border-error" : ""}`}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const n = normalizeDate(value);
          if (n !== null && n !== value) onChange(n); // "7 Juni 2022" -> "07/06/2022"
        }}
      />
      {invalid && (
        <span className="text-label-md font-label-md text-error">
          Tanggal tidak valid. Tulis seperti 07/06/2022 atau 7 Juni 2022.
        </span>
      )}
    </div>
  );
}