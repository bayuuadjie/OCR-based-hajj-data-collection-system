import ExcelJS from "exceljs";

/** Kolom yang diambil dari database untuk ekspor (tanggal sudah berformat dd/mm/yyyy). */
export const EXPORT_SELECT = `
  nama_lengkap, bin_binti, alamat, kecamatan, no_telepon, tempat_lahir,
  to_char(tanggal_lahir, 'DD/MM/YYYY') AS tanggal_lahir,
  pernah_haji, pekerjaan, pendidikan, jenis_kelamin, nama_bank,
  no_rekening, no_validasi, no_porsi,
  to_char(tanggal_validasi, 'DD/MM/YYYY') AS tanggal_validasi,
  to_char(tanggal_porsi, 'DD/MM/YYYY') AS tanggal_porsi
`;

export type ExportRow = Record<string, string | null>;

/**
 * Kolom yang isinya diawali tanda petik ('), mis. '07/06/1999.
 * Ubah daftar ini kalau ada kolom yang mau ditambah/dikurangi.
 */
const APOSTROPHE_COLUMNS = new Set([
  "no_telepon",
  "tanggal_lahir",
  "no_rekening",
  "no_validasi",
  "no_porsi",
  "tanggal_validasi",
  "tanggal_porsi",
]);

const COLUMNS: { key: string; header: string; width: number }[] = [
  { key: "nama_lengkap", header: "Nama Lengkap", width: 30 },
  { key: "bin_binti", header: "Bin/Binti", width: 26 },
  { key: "alamat", header: "Alamat (RT/RW/Desa)", width: 38 },
  { key: "kecamatan", header: "Kecamatan", width: 18 },
  { key: "no_telepon", header: "No. Telepon", width: 18 },
  { key: "tempat_lahir", header: "Tempat Lahir", width: 18 },
  { key: "tanggal_lahir", header: "Tgl Lahir", width: 14 },
  { key: "pernah_haji", header: "Pernah Haji", width: 13 },
  { key: "pekerjaan", header: "Pekerjaan", width: 24 },
  { key: "pendidikan", header: "Pendidikan", width: 22 },
  { key: "jenis_kelamin", header: "JK", width: 6 },
  { key: "nama_bank", header: "Nama Bank", width: 24 },
  { key: "no_rekening", header: "No. Rekening", width: 18 },
  { key: "no_validasi", header: "No. Validasi", width: 16 },
  { key: "no_porsi", header: "No. Porsi", width: 16 },
  { key: "tanggal_validasi", header: "Tgl Validasi", width: 14 },
  { key: "tanggal_porsi", header: "Tgl Porsi", width: 14 },
];

export function buildJemaahWorkbook(rows: ExportRow[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Pendataan Hajj & Umrah";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Data Jemaah", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    ...COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width })),
  ];

  rows.forEach((row, index) => {
    const data: Record<string, string | number | null> = { no: index + 1 };
    for (const col of COLUMNS) {
      const value = row[col.key];
      if (value === null || value === undefined || value === "") {
        data[col.key] = null;
      } else {
        data[col.key] = APOSTROPHE_COLUMNS.has(col.key) ? `'${value}` : value;
      }
    }
    sheet.addRow(data);
  });

  // Tampilan header
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "left" };
  header.height = 22;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E7FF" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FF747686" } } };
  });
  sheet.getColumn("no").alignment = { horizontal: "center" };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length + 1 } };

  return workbook;
}