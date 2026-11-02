import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import operatorsRouter from "./operators";
import jemaahRouter from "./jemaah";
import laporanRouter from "./laporan";
import accountRouter from "./account";
import ocrRouter from "./ocr";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_IDLE_TIMEOUT_MINUTES,
  type SessionPayload,
} from "../lib/session";
import { randomUUID } from "crypto";

const app = express();
const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;

// ─── Middleware global (harus sebelum semua route) ────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

let databaseReady = false;

app.use("/api", (_req, res, next) => {
  if (!databaseReady) {
    return res.status(503).json({ message: "Database sedang disiapkan. Coba lagi sebentar." });
  }
  next();
});

// ─── Route registrasi ─────────────────────────────────────────────────────────
app.use("/api/ocr", ocrRouter);
app.use("/api/laporan", laporanRouter);
app.use("/api/account", accountRouter);
app.use("/api/operators", operatorsRouter);
app.use("/api/jemaah", jemaahRouter);

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000,
};

app.get("/health", (_req, res) => {
  res.status(databaseReady ? 200 : 503).json({ ok: true, databaseReady });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body ?? {};

  if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
    return res.status(400).json({ message: "Email/username dan password wajib diisi." });
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Password terlalu panjang (maksimal 72 byte)." });
  }

  const genericError = { message: "Email/username atau password salah." };

  try {
    const result = await pool.query(
      `SELECT id, username, name, password_hash, role
       FROM operators
       WHERE is_active = true AND (username = $1 OR email = $1)
       LIMIT 1`,
      [identifier]
    );
    const operator = result.rows[0];

    if (!operator) {
      return res.status(401).json(genericError);
    }

    const passwordValid = await bcrypt.compare(password, operator.password_hash);
    if (!passwordValid) {
      return res.status(401).json(genericError);
    }

    const sessionId = randomUUID();
    const sessionResult = await pool.query(
      `UPDATE operators
       SET active_session_id = $1,
           active_session_expires_at = now() + ($5 * interval '1 minute')
       WHERE id = $2 AND is_active = true AND password_hash = $3 AND role = $4
         AND (active_session_id IS NULL OR active_session_expires_at <= now())`,
      [sessionId, operator.id, operator.password_hash, operator.role, SESSION_IDLE_TIMEOUT_MINUTES]
    );
    if (sessionResult.rowCount !== 1) {
      const activeSession = await pool.query(
        `SELECT 1 FROM operators
         WHERE id = $1 AND is_active = true
           AND active_session_id IS NOT NULL AND active_session_expires_at > now()`,
        [operator.id]
      );
      if (activeSession.rowCount === 0) {
        return res.status(401).json(genericError);
      }
      return res.status(409).json({
        message:
          "Akun ini sedang digunakan di perangkat lain. Silakan logout dari perangkat tersebut atau coba lagi setelah sesi berakhir.",
      });
    }

    const token = await createSessionToken({
      sub: operator.id,
      sid: sessionId,
      username: operator.username,
      name: operator.name,
      role: operator.role,
    });

    res.cookie(SESSION_COOKIE_NAME, token, cookieOptions);
    return res.json({
      message: "Login berhasil.",
      user: { username: operator.username, name: operator.name, role: operator.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    let payload: SessionPayload;
    try {
      payload = await verifySessionToken(token);
    } catch {
      res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
      return res.json({ message: "Logout berhasil." });
    }

    try {
      await pool.query(
        `UPDATE operators
         SET active_session_id = NULL, active_session_expires_at = NULL
         WHERE id = $1 AND active_session_id = $2`,
        [payload.sub, payload.sid]
      );
    } catch (err) {
      console.error("Logout session revocation error:", err);
      res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
      return res.status(500).json({ message: "Gagal mengakhiri sesi." });
    }
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ message: "Logout berhasil." });
});

app.get("/api/auth/me", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Belum login." });
  }

  try {
    const payload = await verifySessionToken(token);
    const sessionResult = await pool.query(
      `SELECT is_active FROM operators
       WHERE id = $1 AND active_session_id = $2 AND active_session_expires_at > now()`,
      [payload.sub, payload.sid]
    );
    if (!sessionResult.rows[0]?.is_active) {
      return res.status(401).json({ message: "Sesi tidak valid atau telah berakhir." });
    }
    return res.json({ user: { username: payload.username, role: payload.role } });
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid atau kedaluwarsa." });
  }
});

app.post("/api/auth/heartbeat", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Belum login." });
  }

  let payload: SessionPayload;
  try {
    payload = await verifySessionToken(token);
  } catch {
    return res.status(401).json({ message: "Sesi login telah berakhir." });
  }

  try {
    const result = await pool.query(
      `UPDATE operators
       SET active_session_expires_at = now() + ($3 * interval '1 minute')
       WHERE id = $1 AND active_session_id = $2
         AND is_active = true AND active_session_expires_at > now()`,
      [payload.sub, payload.sid, SESSION_IDLE_TIMEOUT_MINUTES]
    );
    if (result.rowCount !== 1) {
      return res.status(401).json({ message: "Sesi login telah berakhir." });
    }

    const refreshedToken = await createSessionToken({
      sub: payload.sub,
      sid: payload.sid,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    });
    res.cookie(SESSION_COOKIE_NAME, refreshedToken, cookieOptions);
    return res.status(204).end();
  } catch (err) {
    console.error("Session heartbeat error:", err);
    return res.status(500).json({ message: "Gagal memperbarui sesi login." });
  }
});

async function initializeDatabase() {
  try {
    await pool.query("ALTER TABLE operators ADD COLUMN IF NOT EXISTS active_session_id TEXT");
    await pool.query("ALTER TABLE operators ADD COLUMN IF NOT EXISTS active_session_expires_at TIMESTAMPTZ");
    await pool.query(
      `UPDATE operators
       SET active_session_expires_at = now() + ($1 * interval '1 minute')
       WHERE active_session_id IS NOT NULL AND active_session_expires_at IS NULL`,
      [SESSION_IDLE_TIMEOUT_MINUTES]
    );
    databaseReady = true;
    console.log("Database API siap.");
  } catch (err) {
    console.error("Gagal menyiapkan database API; akan mencoba lagi dalam 5 detik:", err);
    setTimeout(() => void initializeDatabase(), 5000);
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server jalan di http://0.0.0.0:${PORT}`);
  void initializeDatabase();
});