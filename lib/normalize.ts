export function canonical(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(bank|kecamatan|kec) /, "");
}

/** "cibiru" / "KEC. CIBIRU" / "Kecamatan Cibiru" -> "Kec. Cibiru" (sama dengan format di database). */
export function normalizeKecamatan(value: string): string {
  const name = value
    .replace(/^\s*(kecamatan|kec)\b\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return "";
  return `Kec. ${name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}`;
}

const BANKS: Record<string, string> = {
  bsi: "Bank Syariah Indonesia",
  "syariah indonesia": "Bank Syariah Indonesia",
  bni: "Bank Negara Indonesia",
  bri: "Bank Rakyat Indonesia",
  bca: "Bank Central Asia",
  btn: "Bank Tabungan Negara",
  bjb: "Bank BJB",
  mandiri: "Bank Mandiri",
  muamalat: "Bank Muamalat",
};

const BANK_ACRONYMS = new Set(["CIMB", "BTPN", "OCBC", "BPRS"]); // singkatan 4 huruf; yang 2-3 huruf otomatis

/** "CIMB NIAGA" / "bank cimb niaga" -> "Bank CIMB Niaga". Aturannya sama dengan layanan OCR. */
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
  return `Bank ${pretty}`;
}

/** Pilihan yang penulisannya setara dengan `value` (abaikan huruf besar/kecil dan awalan), atau null. */
export function matchOption(value: string, options: string[]): string | null {
  const c = canonical(value);
  if (!c) return null;
  return options.find((o) => canonical(o) === c) ?? null;
}