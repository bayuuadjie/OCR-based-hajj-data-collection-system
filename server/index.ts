import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import operatorsRouter from "./operators";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "../lib/session";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use("/api/operators", operatorsRouter);

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 1000 * 60 * 60 * 8, // 8 jam
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body ?? {};

  if (!identifier || !password) {
    return res.status(400).json({ message: "Email/username dan password wajib diisi." });
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

    const token = await createSessionToken({
      sub: operator.id,
      username: operator.username,
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

app.post("/api/auth/logout", (_req, res) => {
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
    return res.json({ user: { username: payload.username, role: payload.role } });
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid atau kedaluwarsa." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server jalan di http://0.0.0.0:${PORT}`);
});