export function canonical(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(bank|kecamatan|kec) /, "");
}

/** "KEC. CIBIRU" / "Kecamatan Cibiru" / "cibiru" -> "Cibiru" (hapus awalan kec./kecamatan, rapikan kapital). */
export function normalizeKecamatan(value: string): string {
  const name = value
    .replace(/^\s*(kecamatan|kec)\b\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return "";
  return name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

const BANKS: Record<string, string> = {
  bsi: "Syariah Indonesia",
  "syariah indonesia": "Syariah Indonesia",
  bni: "Negara Indonesia",
  bri: "Rakyat Indonesia",
  bca: "Central Asia",
  btn: "Tabungan Negara",
  bjb: "BJB",
  mandiri: "Mandiri",
  muamalat: "Muamalat",
};

const BANK_ACRONYMS = new Set(["CIMB", "BTPN", "OCBC", "BPRS"]); // singkatan 4 huruf; yang 2-3 huruf otomatis

/** "bank cimb niaga" / "CIMB NIAGA" -> "CIMB Niaga" (hapus awalan 'bank', rapikan kapital). */
export function normalizeBank(value: string): string {
  const rest = value.replace(/\s+/g, " ").trim().replace(/^bank\s+/i, "");
  if (!rest) return "";
  const mapped = BANKS[rest.toLowerCase()];
  if (mapped) return mapped;
  const pretty = rest
    .split(" ")
    .map((w) => {
      const acronym = /^[A-Za-z]+$/.test(w) && w === w.toUpperCase() && (w.length <= 3 || BANK_ACRONYMS.has(w));
      return acronym ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  return pretty;
}

/** Pilihan yang penulisannya setara dengan `value` (abaikan huruf besar/kecil dan awalan), atau null. */
export function matchOption(value: string, options: string[]): string | null {
  const c = canonical(value);
  if (!c) return null;
  return options.find((o) => canonical(o) === c) ?? null;
}