import { Router, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../lib/session";
import { buildLaporanWorkbook, type CountRow, type Laporan } from "./exportLaporan";

const router = Router();

/** Wajib login dan akun masih aktif (semua role boleh melihat laporan). */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Belum login." });

  try {
    const payload = await verifySessionToken(token);
    const result = await pool.query("SELECT is_active FROM operators WHERE id = $1", [payload.sub]);
    if (!result.rows[0]?.is_active) {
      return res.status(401).json({ message: "Akun tidak aktif." });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid atau kedaluwarsa." });
  }
}

router.use(requireAuth);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validIso(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const AGE_LABELS = ["< 40", "40-49", "50-59", "60-69", "70+", "Tidak diketahui"];

/** Isi bulan yang kosong di antara bulan pertama dan terakhir supaya grafik tidak melompat. */
function fillMonths(rows: { bulan: string; total: number }[]) {
  if (rows.length < 2) return rows;
  const byMonth = new Map(rows.map((r) => [r.bulan, r.total]));
  let [y, m] = rows[0].bulan.split("-").map(Number);
  const [endY, endM] = rows[rows.length - 1].bulan.split("-").map(Number);
  const out: { bulan: string; total: number }[] = [];
  while ((y < endY || (y === endY && m <= endM)) && out.length < 120) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ bulan: key, total: byMonth.get(key) ?? 0 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

async function buildLaporan(from: string | null, to: string | null): Promise<Laporan> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (from) {
    params.push(from);
    conditions.push(`tanggal_validasi >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`tanggal_validasi <= $${params.length}`);
  }
  const where = (extra?: string) => {
    const all = extra ? [...conditions, extra] : conditions;
    return all.length ? `WHERE ${all.join(" AND ")}` : "";
  };

  const L = `count(*) FILTER (WHERE jenis_kelamin = 'L')::int`;
  const P = `count(*) FILTER (WHERE jenis_kelamin = 'P')::int`;
  const SUDAH = `count(*) FILTER (WHERE pernah_haji = 'Sudah')::int`;
  const BELUM = `count(*) FILTER (WHERE pernah_haji = 'Belum')::int`;

  const top = async (column: "pendidikan" | "pekerjaan" | "nama_bank"): Promise<CountRow[]> => {
    const r = await pool.query(
      `SELECT COALESCE(NULLIF(trim(${column}), ''), 'Tidak diisi') AS label, count(*)::int AS total
       FROM jemaah ${where()}
       GROUP BY 1
       ORDER BY total DESC, label ASC
       LIMIT 10`,
      params
    );
    return r.rows;
  };

  const [ringkasan, kecamatan, bulan, usia, pendidikan, pekerjaan, bank] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS total, ${L} AS laki, ${P} AS perempuan,
              ${SUDAH} AS "sudahHaji", ${BELUM} AS "belumHaji",
              count(*) FILTER (WHERE tanggal_validasi IS NULL)::int AS "tanpaValidasi"
       FROM jemaah ${where()}`,
      params
    ),
    pool.query(
      `SELECT COALESCE(NULLIF(trim(kecamatan), ''), 'Tidak diisi') AS kecamatan,
              count(*)::int AS total, ${L} AS laki, ${P} AS perempuan,
              ${SUDAH} AS sudah, ${BELUM} AS belum
       FROM jemaah ${where()}
       GROUP BY 1
       ORDER BY total DESC, kecamatan ASC`,
      params
    ),
    pool.query(
      `SELECT to_char(date_trunc('month', tanggal_validasi), 'YYYY-MM') AS bulan, count(*)::int AS total
       FROM jemaah ${where("tanggal_validasi IS NOT NULL")}
       GROUP BY 1
       ORDER BY 1`,
      params
    ),
    pool.query(
      `SELECT CASE
                WHEN umur IS NULL THEN 'Tidak diketahui'
                WHEN umur < 40 THEN '< 40'
                WHEN umur < 50 THEN '40-49'
                WHEN umur < 60 THEN '50-59'
                WHEN umur < 70 THEN '60-69'
                ELSE '70+'
              END AS label,
              count(*)::int AS total
       FROM (SELECT date_part('year', age(current_date, tanggal_lahir)) AS umur FROM jemaah ${where()}) t
       GROUP BY 1`,
      params
    ),
    top("pendidikan"),
    top("pekerjaan"),
    top("nama_bank"),
  ]);

  const usiaMap = new Map<string, number>(usia.rows.map((r: CountRow) => [r.label, r.total]));
  const usiaRows = AGE_LABELS.map((label) => ({ label, total: usiaMap.get(label) ?? 0 })).filter(
    (r) => r.label !== "Tidak diketahui" || r.total > 0
  );

  return {
    periode: { from, to },
    ringkasan: ringkasan.rows[0],
    perKecamatan: kecamatan.rows,
    perBulan: fillMonths(bulan.rows),
    usia: usiaRows,
    pendidikan,
    pekerjaan,
    bank,
  };
}

/** Baca ?from=&to= (YYYY-MM-DD). Mengembalikan pesan error kalau tanggalnya tidak valid. */
function readPeriod(req: Request): { from: string | null; to: string | null } | { error: string } {
  const from = String(req.query.from ?? "").trim();
  const to = String(req.query.to ?? "").trim();
  if (from && !validIso(from)) return { error: "Tanggal 'dari' tidak valid." };
  if (to && !validIso(to)) return { error: "Tanggal 'sampai' tidak valid." };
  if (from && to && from > to) return { error: "Tanggal 'dari' tidak boleh setelah tanggal 'sampai'." };
  return { from: from || null, to: to || null };
}

// GET /api/laporan?from=YYYY-MM-DD&to=YYYY-MM-DD   (filter berdasarkan tanggal validasi)
router.get("/", async (req, res) => {
  const period = readPeriod(req);
  if ("error" in period) return res.status(400).json({ message: period.error });

  try {
    res.json(await buildLaporan(period.from, period.to));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyusun laporan." });
  }
});

// GET /api/laporan/export  -> file Excel dengan filter yang sama
router.get("/export", async (req, res) => {
  const period = readPeriod(req);
  if ("error" in period) return res.status(400).json({ message: period.error });

  try {
    const workbook = buildLaporanWorkbook(await buildLaporan(period.from, period.to));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="laporan-jemaah.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: "Gagal mengekspor laporan." });
  }
});

export default router;