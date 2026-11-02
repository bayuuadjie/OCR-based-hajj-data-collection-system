export function canonical(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(bank|kecamatan|kec|desa|kelurahan|kel|dusun|dsn) /, "");
}

/** "KEC. CIBIRU" / "Kecamatan Cibiru" / "cibiru" -> "CIBIRU" (hapus awalan kec./kecamatan, huruf besar). */
export function normalizeKecamatan(value: string): string {
  const name = value
    .replace(/^\s*(kecamatan|kec)\b\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return name.toUpperCase();
}

/** "Desa Sindangjaya" / "sindangjaya" -> "SINDANGJAYA" (hapus awalan desa/kelurahan/dusun, huruf besar). */
export function normalizeDesa(value: string): string {
  const name = value
    .replace(/^\s*(desa|kelurahan|kel|dusun|dsn)\b\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return name.toUpperCase();
}

const BANKS: Record<string, string> = {
  bsi: "SYARIAH INDONESIA",
  "syariah indonesia": "SYARIAH INDONESIA",
  bni: "NEGARA INDONESIA",
  bri: "RAKYAT INDONESIA",
  bca: "CENTRAL ASIA",
  btn: "TABUNGAN NEGARA",
  bjb: "BJB",
  mandiri: "MANDIRI",
  muamalat: "MUAMALAT",
};

/** "bank cimb niaga" / "CIMB NIAGA" -> "CIMB NIAGA" (hapus awalan 'bank', huruf besar). */
export function normalizeBank(value: string): string {
  const rest = value.replace(/\s+/g, " ").trim().replace(/^bank\s+/i, "");
  if (!rest) return "";
  const mapped = BANKS[rest.toLowerCase()];
  if (mapped) return mapped;
  return rest.toUpperCase();
}

/** Pilihan yang penulisannya setara dengan `value` (abaikan huruf besar/kecil dan awalan), atau null. */
export function matchOption(value: string, options: string[]): string | null {
  const c = canonical(value);
  if (!c) return null;
  return options.find((o) => canonical(o) === c) ?? null;
}