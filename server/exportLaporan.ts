import ExcelJS from "exceljs";

export type CountRow = { label: string; total: number };

export type Laporan = {
  periode: { from: string | null; to: string | null }; // filter tanggal validasi (YYYY-MM-DD)
  ringkasan: {
    total: number;
    laki: number;
    perempuan: number;
    sudahHaji: number;
    belumHaji: number;
    tanpaValidasi: number; // belum punya tanggal validasi
  };
  perKecamatan: {
    kecamatan: string;
    total: number;
    laki: number;
    perempuan: number;
    sudah: number;
    belum: number;
  }[];
  perBulan: { bulan: string; total: number }[]; // bulan = "YYYY-MM", berdasarkan tanggal validasi
  usia: CountRow[];
  pendidikan: CountRow[];
  pekerjaan: CountRow[];
  bank: CountRow[];
};

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function bulanLabel(bulan: string): string {
  const [y, m] = bulan.split("-");
  return `${MONTHS_ID[Number(m) - 1] ?? m} ${y}`;
}

function tanggal(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function periodeLabel(p: Laporan["periode"]): string {
  if (p.from && p.to) return `${tanggal(p.from)} s.d. ${tanggal(p.to)}`;
  if (p.from) return `Mulai ${tanggal(p.from)}`;
  if (p.to) return `Sampai ${tanggal(p.to)}`;
  return "Semua periode";
}

type Cell = string | number;

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  laporan: Laporan,
  headers: string[],
  rows: Cell[][],
  opts: { totalRow?: boolean; widths?: number[]; percentCol?: number } = {}
) {
  const ws = wb.addWorksheet(name);

  ws.addRow([`Laporan Rekapitulasi Jemaah - ${name}`]).font = { bold: true, size: 13 };
  ws.addRow([`Periode tanggal validasi: ${periodeLabel(laporan.periode)}`]).font = { italic: true };
  ws.addRow([]);

  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E7FF" } };
    c.border = { bottom: { style: "thin", color: { argb: "FF747686" } } };
  });

  for (const r of rows) ws.addRow(r);

  if (opts.totalRow && rows.length > 0) {
    const sums: Cell[] = ["Total"];
    for (let col = 1; col < headers.length; col++) {
      sums.push(rows.reduce((acc, r) => acc + (typeof r[col] === "number" ? (r[col] as number) : 0), 0));
    }
    const total = ws.addRow(sums);
    total.font = { bold: true };
    total.eachCell((c) => {
      c.border = { top: { style: "thin", color: { argb: "FF747686" } } };
    });
  }

  if (opts.percentCol !== undefined) {
    ws.getColumn(opts.percentCol + 1).numFmt = "0.0%";
  }
  (opts.widths ?? headers.map(() => 18)).forEach((w, i) => (ws.getColumn(i + 1).width = w));
  headerRow.alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 4 }];
}

export function buildLaporanWorkbook(l: Laporan): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistem Pendataan Hajj & Umrah";
  wb.created = new Date();

  const r = l.ringkasan;
  addSheet(
    wb,
    "Ringkasan",
    l,
    ["Keterangan", "Jumlah"],
    [
      ["Total jemaah", r.total],
      ["Laki-laki", r.laki],
      ["Perempuan", r.perempuan],
      ["Sudah pernah haji", r.sudahHaji],
      ["Belum pernah haji", r.belumHaji],
      ["Belum ada tanggal validasi", r.tanpaValidasi],
    ],
    { widths: [32, 14] }
  );

  addSheet(
    wb,
    "Per Kecamatan",
    l,
    ["Kecamatan", "Total", "Laki-laki", "Perempuan", "Sudah Haji", "Belum Haji"],
    l.perKecamatan.map((k) => [k.kecamatan, k.total, k.laki, k.perempuan, k.sudah, k.belum]),
    { totalRow: true, widths: [28, 10, 12, 12, 12, 12] }
  );

  addSheet(
    wb,
    "Per Bulan Validasi",
    l,
    ["Bulan", "Jumlah"],
    l.perBulan.map((b) => [bulanLabel(b.bulan), b.total]),
    { totalRow: true, widths: [24, 12] }
  );

  const share = (rows: CountRow[]) =>
    rows.map((x) => [x.label, x.total, r.total ? x.total / r.total : 0] as Cell[]);

  addSheet(wb, "Kelompok Usia", l, ["Kelompok usia (tahun)", "Jumlah", "Persen"], share(l.usia), {
    widths: [26, 12, 12],
    percentCol: 2,
  });
  addSheet(wb, "Pendidikan", l, ["Pendidikan", "Jumlah", "Persen"], share(l.pendidikan), {
    widths: [34, 12, 12],
    percentCol: 2,
  });
  addSheet(wb, "Pekerjaan", l, ["Pekerjaan", "Jumlah", "Persen"], share(l.pekerjaan), {
    widths: [34, 12, 12],
    percentCol: 2,
  });
  addSheet(wb, "Bank", l, ["Nama Bank", "Jumlah", "Persen"], share(l.bank), {
    widths: [34, 12, 12],
    percentCol: 2,
  });

  return wb;
}