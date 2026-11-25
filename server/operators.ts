import { Router, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "../lib/session";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionPayload;
  }
}

const router = Router();

/** Bedakan duplikat username dan email agar pesan 409 tidak menyesatkan. */
function duplicateMessage(err: any): string {
  if (err?.constraint === "operators_username_key") return "Username sudah dipakai akun lain.";
  if (err?.constraint === "operators_email_key") return "Email sudah dipakai akun lain.";
  return "Username atau email sudah dipakai.";
}

/** Wajib login + role ADMIN + akun masih aktif di database. */
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Belum login." });

  try {
    const payload = await verifySessionToken(token);
    const result = await pool.query(
      `SELECT role, is_active FROM operators
       WHERE id = $1 AND active_session_id = $2 AND active_session_expires_at > now()`,
      [payload.sub, payload.sid]
    );
    const row = result.rows[0];

    if (!row || !row.is_active) {
      return res.status(401).json({ message: "Akun tidak aktif." });
    }
    if (row.role !== "ADMIN") {
      return res.status(403).json({ message: "Hanya admin yang boleh mengakses ini." });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid atau kedaluwarsa." });
  }
}

router.use(requireAdmin);

// Daftar semua akun (akun baru tampil di paling atas)
router.get("/", async (_req, res) => {
  // Daftar akun harus selalu segar; jangan sampai browser menyimpan respons lama.
  res.set("Cache-Control", "no-store, max-age=0");
  try {
    const result = await pool.query(
      `SELECT id, username, email, name, role, is_active, created_at
       FROM operators
       ORDER BY created_at DESC, id ASC`
    );
    res.json({ operators: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data akun." });
  }
});

// Tambah akun baru
router.post("/", async (req, res) => {
  const { username, password, name, role, email } = req.body ?? {};

  if (!username || !password || !name) {
    return res.status(400).json({ message: "Username, nama, dan password wajib diisi." });
  }
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
    return res
      .status(400)
      .json({ message: "Username 3-30 karakter: huruf, angka, titik, strip, atau underscore." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password minimal 8 karakter." });
  }
  if (Buffer.byteLength(String(password), "utf8") > 72) {
    return res.status(400).json({ message: "Password terlalu panjang (maksimal 72 byte)." });
  }

  try {
    const passwordHash = await bcrypt.hash(String(password), 12);
    const result = await pool.query(
      `INSERT INTO operators (id, username, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, name, role, is_active, created_at`,
      [randomUUID(), username, email || null, name, passwordHash, role === "ADMIN" ? "ADMIN" : "OPERATOR"]
    );
    res.status(201).json({ message: "Akun berhasil dibuat.", operator: result.rows[0] });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: duplicateMessage(err) });
    }
    console.error(err);
    res.status(500).json({ message: "Gagal membuat akun." });
  }
});

// Edit akun (nama, email, role, aktif/nonaktif, dan/atau reset password)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive, password } = req.body ?? {};

  // Cegah admin mengunci dirinya sendiri
  if (id === req.user?.sub) {
    if (role !== undefined && role !== "ADMIN") {
      return res.status(400).json({ message: "Kamu tidak bisa menurunkan role akunmu sendiri." });
    }
    if (isActive === false) {
      return res.status(400).json({ message: "Kamu tidak bisa menonaktifkan akunmu sendiri." });
    }
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  const add = (column: string, value: unknown) => {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  };

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ message: "Nama tidak boleh kosong." });
    add("name", String(name).trim());
  }
  if (email !== undefined) add("email", email || null);
  if (role !== undefined) add("role", role === "ADMIN" ? "ADMIN" : "OPERATOR");
  if (isActive !== undefined) add("is_active", Boolean(isActive));
  if (password) {
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter." });
    }
    if (Buffer.byteLength(String(password), "utf8") > 72) {
      return res.status(400).json({ message: "Password terlalu panjang (maksimal 72 byte)." });
    }
    add("password_hash", await bcrypt.hash(String(password), 12));
  }
  if (role !== undefined || isActive !== undefined || password) {
    add("active_session_id", null);
    add("active_session_expires_at", null);
  }

  if (sets.length === 0) {
    return res.status(400).json({ message: "Tidak ada data yang diubah." });
  }

  sets.push("updated_at = now()");
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE operators SET ${sets.join(", ")} WHERE id = $${values.length}
       RETURNING id, username, email, name, role, is_active, created_at`,
      values
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Akun tidak ditemukan." });
    }
    res.json({ message: "Akun berhasil diperbarui.", operator: result.rows[0] });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: duplicateMessage(err) });
    }
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui akun." });
  }
});

export default router;