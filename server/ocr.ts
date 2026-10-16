import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { pool } from "./db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../lib/session";

/**
 * Jalur OCR: browser -> Express (cek login) -> layanan OCR Python di komputer yang sama.
 * File hanya ditahan di memori selama diproses, tidak disimpan ke disk.
 */
const router = Router();

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error("TIPE_FILE"));
  },
});

/** Wajib login dan akun masih aktif. */
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

// POST /api/ocr/1 | /2 | /3   (form-data, kolom "file")
router.post("/:page", requireAuth, (req, res) => {
  const page = Number(req.params.page);
  if (![1, 2, 3].includes(page)) {
    return res.status(404).json({ message: "Lembar tidak dikenal (gunakan 1, 2, atau 3)." });
  }

  upload.single("file")(req, res, async (uploadError: unknown) => {
    if (uploadError) {
      const e = uploadError as { code?: string; message?: string };
      if (e.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File terlalu besar (maksimal 15 MB)." });
      }
      if (e.message === "TIPE_FILE") {
        return res.status(400).json({ message: "Gunakan file gambar (JPG, PNG) atau PDF." });
      }
      return res.status(400).json({ message: "Upload gagal." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "File belum dipilih." });
    }

    // Dibaca di sini (bukan di atas) supaya nilai .env sudah termuat
    const ocrUrl = process.env.OCR_URL ?? "http://127.0.0.1:8001";
    const ocrToken = process.env.OCR_TOKEN;

    const body = new FormData();
    body.append(
      "file",
      new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype }),
      "scan"
    );

    try {
      const response = await fetch(`${ocrUrl}/ocr/${page}`, {
        method: "POST",
        body,
        headers: ocrToken ? { "X-OCR-Token": ocrToken } : {},
        signal: AbortSignal.timeout(90_000),
      });

      const data = (await response.json().catch(() => null)) as
        | { detail?: string; [key: string]: unknown }
        | null;

      if (response.status === 401) {
        console.error("OCR menolak token: OCR_TOKEN di Express dan Python tidak sama.");
        return res.status(502).json({ message: "Pengaturan layanan OCR tidak cocok (OCR_TOKEN)." });
      }
      if (!response.ok) {
        return res
          .status(response.status >= 500 ? 502 : response.status)
          .json({ message: data?.detail ?? "OCR gagal membaca file." });
      }
      return res.json(data);
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      console.error("Gagal menghubungi layanan OCR:", err instanceof Error ? err.message : err);
      return res.status(timedOut ? 504 : 503).json({
        message: timedOut
          ? "OCR terlalu lama merespons."
          : "Layanan OCR belum berjalan. Jalankan layanan OCR (folder ocr_service) lalu coba lagi.",
      });
    }
  });
});

export default router;