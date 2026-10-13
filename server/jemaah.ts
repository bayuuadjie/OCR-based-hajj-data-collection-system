import { Router, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import { verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "../lib/session";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionPayload;
  }
}

const router = Router();

/** Wajib login dan akun masih aktif. Role diambil dari database (bukan dari token). */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Belum login." });

  try {
    const payload = await verifySessionToken(token);
    const result = await pool.query("SELECT role, is_active FROM operators WHERE id = $1", [
      payload.sub,
    ]);
    const row = result.rows[0];

    if (!row || !row.is_active) {
      return res.status(401).json({ message: "Akun tidak aktif." });
    }

    req.user = { ...payload, role: row.role };
    next();
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid atau kedaluwarsa." });
  }
}

router.use(requireAuth);

const SELECT_COLUMNS = `
  id,
  nama_lengkap AS "namaLengkap",
  bin_binti AS "binBinti",
  nik,
  alamat,
  kecamatan,
  no_telepon AS "noTelepon",
  tempat_lahir AS "tempatLahir",
  to_char(tanggal_lahir, 'DD-MM-YYYY') AS "tanggalLahir",
  status_haji AS "statusHaji",
  pekerjaan,
  pendidikan,
  jenis_kelamin AS "jenisKelamin",
  nama_bank AS "namaBank",
  no_rekening AS "noRekening",
  no_validasi AS "noValidasi",
  no_porsi AS "noPorsi",
  to_char(tanggal_validasi, 'DD-MM-YYYY') AS "tanggalValidasi",
  to_char(tanggal_porsi, 'DD-MM-YYYY') AS "tanggalPorsi"
`;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Daftar jemaah: ?q=&status=&kecamatan=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=25
router.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const kecamatan = String(req.query.kecamatan ?? "").trim();
  const from = String(req.query.from ?? "").trim();
  const to = String(req.query.to ?? "").trim();

  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  const push = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (q) {
    // Escape karakter wildcard supaya pencarian "50%" tidak dianggap pola
    const p = push(`%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    where.push(
      `(nama_lengkap ILIKE ${p} OR bin_binti ILIKE ${p} OR alamat ILIKE ${p}
        OR nik ILIKE ${p} OR no_porsi ILIKE ${p} OR no_validasi ILIKE ${p})`
    );
  }
  if (status && status !== "all") where.push(`status_haji = ${push(status)}`);
  if (kecamatan) where.push(`kecamatan = ${push(kecamatan)}`);
  if (ISO_DATE.test(from)) where.push(`tanggal_validasi >= ${push(from)}`);
  if (ISO_DATE.test(to)) where.push(`tanggal_validasi <= ${push(to)}`);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(`SELECT count(*)::int AS total FROM jemaah ${whereSql}`, params);
    const total: number = countResult.rows[0].total;

    const dataResult = await pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM jemaah
       ${whereSql}
       ORDER BY tanggal_validasi ASC NULLS LAST, alamat ASC NULLS LAST, nama_lengkap ASC
       LIMIT ${push(limit)} OFFSET ${push(offset)}`,
      params
    );

    res.json({ data: dataResult.rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data jemaah." });
  }
});

// Daftar kecamatan yang ada di data (untuk dropdown filter)
router.get("/kecamatan", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT kecamatan FROM jemaah WHERE kecamatan IS NOT NULL ORDER BY kecamatan`
    );
    res.json({ kecamatan: result.rows.map((r) => r.kecamatan) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil daftar kecamatan." });
  }
});

// Hapus data jemaah (khusus admin)
router.delete("/:id", async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Hanya admin yang boleh menghapus data jemaah." });
  }

  try {
    const result = await pool.query("DELETE FROM jemaah WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }
    res.json({ message: "Data jemaah dihapus." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus data." });
  }
});

export default router;