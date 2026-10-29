import { Router, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { pool } from "./db";
import { verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "../lib/session";
import { buildJemaahWorkbook, EXPORT_SELECT } from "./exportJemaah";

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
  alamat,
  kecamatan,
  no_telepon AS "noTelepon",
  tempat_lahir AS "tempatLahir",
  to_char(tanggal_lahir, 'DD-MM-YYYY') AS "tanggalLahir",
  pernah_haji AS "pernahHaji",
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

// Diawali "jemaah." supaya yang diurutkan adalah kolom asli (tipe DATE), bukan alias teks
// "dd/mm/yyyy" di query ekspor yang namanya sama.
const ORDER_BY =
  "ORDER BY jemaah.tanggal_validasi ASC NULLS LAST, jemaah.alamat ASC NULLS LAST, jemaah.nama_lengkap ASC";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Susun WHERE dari query string. Dipakai bersama oleh daftar dan ekspor. */
function buildFilters(query: Request["query"]) {
  const q = String(query.q ?? "").trim();
  const pernahHaji = String(query.pernahHaji ?? "").trim();
  const kecamatan = String(query.kecamatan ?? "").trim();
  const from = String(query.from ?? "").trim();
  const to = String(query.to ?? "").trim();

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
        OR no_porsi ILIKE ${p} OR no_validasi ILIKE ${p})`
    );
  }
  if (pernahHaji === "Sudah" || pernahHaji === "Belum") {
    where.push(`pernah_haji = ${push(pernahHaji)}`);
  }
  if (kecamatan) where.push(`kecamatan = ${push(kecamatan)}`);
  if (ISO_DATE.test(from)) where.push(`tanggal_validasi >= ${push(from)}`);
  if (ISO_DATE.test(to)) where.push(`tanggal_validasi <= ${push(to)}`);

  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

// Daftar jemaah: ?q=&pernahHaji=&kecamatan=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=25
router.get("/", async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * limit;

  const { whereSql, params } = buildFilters(req.query);

  try {
    const countResult = await pool.query(`SELECT count(*)::int AS total FROM jemaah ${whereSql}`, params);
    const total: number = countResult.rows[0].total;

    const dataResult = await pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM jemaah
       ${whereSql}
       ${ORDER_BY}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
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

// Nilai yang sudah ada di data, untuk dropdown + autocomplete di form Input Data.
// Penulisan yang hanya beda huruf besar/kecil atau awalan ("CIMB Niaga" vs "Bank CIMB Niaga")
// digabung jadi satu pilihan; yang ditampilkan adalah penulisan yang paling sering dipakai.
const OPTION_COLUMNS = {
  kecamatan: { column: "kecamatan", prefix: /^(kecamatan|kec) / },
  namaBank: { column: "nama_bank", prefix: /^bank / },
  pendidikan: { column: "pendidikan", prefix: null },
  pekerjaan: { column: "pekerjaan", prefix: null },
} as const;

function mergeSpellings(rows: { value: string; total: number }[], prefix: RegExp | null) {
  const canon = (v: string) => {
    const c = v.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
    return prefix ? c.replace(prefix, "") : c;
  };
  const groups = new Map<string, { best: { value: string; total: number }; total: number }>();
  for (const row of rows) {
    const key = canon(row.value);
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { best: row, total: row.total });
      continue;
    }
    g.total += row.total;
    const better =
      row.total > g.best.total ||
      (row.total === g.best.total && g.best.value === g.best.value.toUpperCase() && row.value !== row.value.toUpperCase());
    if (better) g.best = row;
  }
  return [...groups.values()]
    .sort((a, b) => b.total - a.total || a.best.value.localeCompare(b.best.value, "id"))
    .slice(0, 300)
    .map((g) => g.best.value);
}

router.get("/options", async (_req, res) => {
  try {
    const entries = await Promise.all(
      Object.entries(OPTION_COLUMNS).map(async ([key, { column, prefix }]) => {
        const r = await pool.query(
          `SELECT trim(${column}) AS value, count(*)::int AS total
           FROM jemaah
           WHERE ${column} IS NOT NULL AND trim(${column}) <> ''
           GROUP BY 1`
        );
        return [key, mergeSpellings(r.rows, prefix)] as const;
      })
    );
    res.json(Object.fromEntries(entries));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil daftar pilihan." });
  }
});

// Ekspor ke Excel (.xlsx) dengan filter yang sama seperti tabel, tanpa paginasi
const EXPORT_MAX_ROWS = 50000;

router.get("/export", async (req, res) => {
  const { whereSql, params } = buildFilters(req.query);

  try {
    const result = await pool.query(
      `SELECT ${EXPORT_SELECT} FROM jemaah ${whereSql} ${ORDER_BY} LIMIT ${EXPORT_MAX_ROWS}`,
      params
    );

    const workbook = buildJemaahWorkbook(result.rows);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="data-jemaah.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Gagal mengekspor data." });
    }
  }
});

// ---- Tambah data jemaah baru (dari form Input Data Baru) ----
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** null = kosong, undefined = format salah, selain itu tanggal ISO valid (YYYY-MM-DD). */
function isoDate(v: unknown): string | null | undefined {
  const s = str(v);
  if (!s) return null;
  if (!ISO_DATE.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? undefined : s;
}

router.post("/", async (req, res) => {
  const b = req.body ?? {};

  const required: [string, string | null][] = [
    ["Nama", str(b.namaLengkap)],
    ["Nama ayah (Bin/Binti)", str(b.binBinti)],
    ["Alamat", str(b.alamat)],
    ["Nomor porsi", str(b.noPorsi)],
  ];
  const missing = required.filter(([, v]) => !v).map(([label]) => label);
  if (missing.length) {
    return res.status(400).json({ message: `Wajib diisi: ${missing.join(", ")}.` });
  }

  const jenisKelamin = str(b.jenisKelamin);
  if (jenisKelamin && jenisKelamin !== "L" && jenisKelamin !== "P") {
    return res.status(400).json({ message: "Jenis kelamin harus L atau P." });
  }
  const pernahHaji = str(b.pernahHaji) ?? "Belum";
  if (pernahHaji !== "Sudah" && pernahHaji !== "Belum") {
    return res.status(400).json({ message: "Status haji harus Sudah atau Belum." });
  }

  const dates: [string, string | null | undefined][] = [
    ["Tanggal lahir", isoDate(b.tanggalLahir)],
    ["Tanggal porsi", isoDate(b.tanggalPorsi)],
    ["Tanggal validasi", isoDate(b.tanggalValidasi)],
  ];
  const badDate = dates.find(([, v]) => v === undefined);
  if (badDate) {
    return res.status(400).json({ message: `${badDate[0]} tidak valid.` });
  }
  const [tanggalLahir, tanggalPorsi, tanggalValidasi] = dates.map(([, v]) => v as string | null);

  try {
    const result = await pool.query(
      `INSERT INTO jemaah (
         id, nama_lengkap, bin_binti, alamat, kecamatan, no_telepon, tempat_lahir, tanggal_lahir,
         pernah_haji, pekerjaan, pendidikan, jenis_kelamin, nama_bank, no_rekening,
         no_validasi, no_porsi, tanggal_validasi, tanggal_porsi, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        randomUUID(), str(b.namaLengkap), str(b.binBinti), str(b.alamat), str(b.kecamatan),
        str(b.noTelepon), str(b.tempatLahir), tanggalLahir, pernahHaji, str(b.pekerjaan),
        str(b.pendidikan), jenisKelamin, str(b.namaBank), str(b.noRekening),
        str(b.noValidasi), str(b.noPorsi), tanggalValidasi, tanggalPorsi, req.user?.sub ?? null,
      ]
    );
    res.status(201).json({ id: result.rows[0].id, message: "Data jemaah disimpan." });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: "Nomor porsi ini sudah terdaftar." });
    }
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan data jemaah." });
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