import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "../lib/session";

type Account = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "OPERATOR";
  created_at: string;
};

declare module "express-serve-static-core" {
  interface Request {
    account?: Account;
  }
}

/** Akun milik pengguna yang sedang login (halaman Pengaturan). */
const router = Router();

/** Wajib login dan akun masih aktif. Data akun diambil segar dari database. */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Belum login." });

  try {
    const payload = await verifySessionToken(token);
    const result = await pool.query(
      `SELECT id, username, name, email, role, is_active, created_at FROM operators WHERE id = $1`,
      [payload.sub]
    );
    const row = result.rows[0];
    if (!row || !row.is_active) {
      return res.status(401).json({ message: "Akun tidak aktif." });
    }
    req.account = row;
    next();
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid atau kedaluwarsa." });
  }
}

router.use(requireAuth);

const toProfile = (a: Account) => ({
  username: a.username,
  name: a.name,
  email: a.email,
  role: a.role,
  createdAt: a.created_at,
});

/** Terbitkan ulang cookie sesi supaya nama di topbar langsung ikut berubah. */
async function reissueSession(res: Response, a: Pick<Account, "id" | "username" | "name" | "role">) {
  const token = await createSessionToken({ sub: a.id, username: a.username, name: a.name, role: a.role });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000, // 8 jam, sama dengan masa berlaku token
  });
}

// GET /api/account
router.get("/", (req, res) => {
  res.json(toProfile(req.account!));
});

// PATCH /api/account/profile  { name, email }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.patch("/profile", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: "Nama harus 2-100 karakter." });
  }
  if (email && (email.length > 254 || !EMAIL.test(email))) {
    return res.status(400).json({ message: "Format email tidak valid." });
  }

  try {
    await pool.query(`UPDATE operators SET name = $1, email = $2, updated_at = now() WHERE id = $3`, [
      name,
      email || null,
      req.account!.id,
    ]);
    const updated: Account = { ...req.account!, name, email: email || null };
    await reissueSession(res, updated);
    res.json({ message: "Profil diperbarui.", profile: toProfile(updated) });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: "Email sudah dipakai akun lain." });
    }
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui profil." });
  }
});

// POST /api/account/password  { currentPassword, newPassword }
// Batasi tebakan password lama: maks. 5 salah per 15 menit per akun (disimpan di memori server).
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; resetAt: number }>();

function lockedMinutes(id: string): number {
  const f = failures.get(id);
  if (!f) return 0;
  if (Date.now() > f.resetAt) {
    failures.delete(id);
    return 0;
  }
  return f.count >= MAX_FAILS ? Math.ceil((f.resetAt - Date.now()) / 60000) : 0;
}

function recordFailure(id: string) {
  const now = Date.now();
  const f = failures.get(id);
  if (!f || now > f.resetAt) failures.set(id, { count: 1, resetAt: now + WINDOW_MS });
  else f.count += 1;
}

router.post("/password", async (req, res) => {
  const current = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const next = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  const id = req.account!.id;

  if (!current || !next) {
    return res.status(400).json({ message: "Password saat ini dan password baru wajib diisi." });
  }
  if (next.length < 8) {
    return res.status(400).json({ message: "Password baru minimal 8 karakter." });
  }
  // bcrypt hanya memakai 72 byte pertama; tolak yang lebih panjang agar tidak terpotong diam-diam
  if (Buffer.byteLength(next, "utf8") > 72) {
    return res.status(400).json({ message: "Password baru terlalu panjang (maksimal 72 karakter)." });
  }
  if (next === current) {
    return res.status(400).json({ message: "Password baru harus berbeda dari password saat ini." });
  }

  const locked = lockedMinutes(id);
  if (locked > 0) {
    return res
      .status(429)
      .json({ message: `Terlalu banyak percobaan salah. Coba lagi dalam ${locked} menit.` });
  }

  try {
    const result = await pool.query(`SELECT password_hash FROM operators WHERE id = $1`, [id]);
    const valid = await bcrypt.compare(current, result.rows[0].password_hash);
    if (!valid) {
      recordFailure(id);
      return res.status(400).json({ message: "Password saat ini salah." });
    }

    const hash = await bcrypt.hash(next, 12);
    await pool.query(`UPDATE operators SET password_hash = $1, updated_at = now() WHERE id = $2`, [hash, id]);
    failures.delete(id);
    res.json({ message: "Password berhasil diganti." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengganti password." });
  }
});

// GET /api/account/system  (khusus admin): status database & layanan OCR + peringatan konfigurasi
router.get("/system", async (req, res) => {
  if (req.account?.role !== "ADMIN") {
    return res.status(403).json({ message: "Hanya admin yang boleh melihat status sistem." });
  }

  const database = await pool
    .query("SELECT 1")
    .then(() => ({ ok: true }))
    .catch(() => ({ ok: false }));

  const ocrUrl = process.env.OCR_URL ?? "http://127.0.0.1:8001";
  let ocr: { ok: boolean; message?: string; tesseract?: string; lang?: string; pdf?: boolean } = {
    ok: false,
    message: "Layanan OCR tidak berjalan atau tidak bisa dihubungi.",
  };
  try {
    const r = await fetch(`${ocrUrl}/health`, { signal: AbortSignal.timeout(3000) });
    const j = (await r.json()) as { ok?: boolean; tesseract?: string; lang?: string; pdf?: boolean };
    if (r.ok && j.ok) ocr = { ok: true, tesseract: j.tesseract, lang: j.lang, pdf: j.pdf };
  } catch {
    // tetap memakai pesan bawaan di atas
  }

  const secret = process.env.SESSION_SECRET;
  const ocrToken = process.env.OCR_TOKEN;
  const warnings: string[] = [];
  if (!secret) {
    warnings.push("SESSION_SECRET belum diisi di .env, server memakai nilai bawaan yang tidak aman.");
  }
  if (!ocrToken) {
    warnings.push("OCR_TOKEN belum diisi di .env, layanan OCR menerima panggilan tanpa token.");
  } else if (secret && ocrToken === secret) {
    warnings.push("OCR_TOKEN sama dengan SESSION_SECRET. Gunakan nilai acak yang berbeda untuk masing-masing.");
  }

  res.json({ database, ocr, warnings });
});

export default router;