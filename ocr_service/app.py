from __future__ import annotations

import hmac
import io
import os
import statistics

import pytesseract
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from PIL import Image, ImageFilter, ImageOps
from pytesseract import Output

from extract import PAGES, expected_missing, extract_fields

try:  # PDF opsional (PyMuPDF; nama modul baru "pymupdf", yang lama "fitz")
    import pymupdf as fitz
except ImportError:  # pragma: no cover
    try:
        import fitz
    except ImportError:
        fitz = None

OCR_TOKEN = os.environ.get("OCR_TOKEN")  # rahasia bersama dengan server Express
MAX_BYTES = 15 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 120_000_000  # cegah "decompression bomb"

BILINEAR = Image.Resampling.BILINEAR
BICUBIC = Image.Resampling.BICUBIC
LANCZOS = Image.Resampling.LANCZOS
BOX = Image.Resampling.BOX

app = FastAPI(title="OCR Jemaah", docs_url=None, redoc_url=None, openapi_url=None)


def require_token(x_ocr_token: str | None = Header(default=None)) -> None:
    if OCR_TOKEN and not hmac.compare_digest(x_ocr_token or "", OCR_TOKEN):
        raise HTTPException(status_code=401, detail="Token OCR tidak valid.")


def tesseract_lang() -> str:
    try:
        langs = set(pytesseract.get_languages(config=""))
    except Exception:
        return "eng"
    if {"ind", "eng"} <= langs:
        return "ind+eng"
    return "ind" if "ind" in langs else "eng"


LANG = tesseract_lang()


# --------------------------------------------------------------------------- #
# Gambar
# --------------------------------------------------------------------------- #


def load_image(data: bytes) -> Image.Image:
    if data[:4] == b"%PDF":
        if fitz is None:
            raise HTTPException(400, "Dukungan PDF belum terpasang (pip install pymupdf). Gunakan gambar JPG/PNG.")
        try:
            doc = fitz.open(stream=data, filetype="pdf")
            if doc.page_count == 0:
                raise ValueError("PDF kosong")
            png = doc[0].get_pixmap(dpi=220).tobytes("png")  # hanya halaman pertama
            return Image.open(io.BytesIO(png))
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(400, "PDF tidak bisa dibaca.")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
        return img
    except Exception:
        raise HTTPException(400, "File bukan gambar yang valid (gunakan JPG, PNG, atau PDF).")


def estimate_skew(gray: Image.Image) -> float:
    """
    Perkirakan kemiringan (derajat) dengan profil proyeksi: pada sudut yang tepat, baris teks
    sejajar sehingga jumlah piksel gelap per baris paling "bergelombang" (varians terbesar).
    Hanya memakai Pillow, tanpa numpy/OpenCV.
    """
    small = gray.copy()
    small.thumbnail((700, 700))
    bw = small.point([0 if value < 150 else 255 for value in range(256)])

    def score(angle: float) -> float:
        r = bw.rotate(angle, resample=BILINEAR, fillcolor=255)
        rows = list(r.resize((1, r.height), BOX).tobytes())
        mean = sum(rows) / len(rows)
        return sum((v - mean) ** 2 for v in rows)

    best = max((a / 2 for a in range(-12, 13)), key=score)  # -6..6 derajat
    best = max((best + d / 10 for d in range(-4, 5)), key=score)  # haluskan
    return best


def preprocess(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)  # foto HP sering tersimpan miring
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, "white")
        bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[-1])
        img = bg
    img = img.convert("L")
    img = img.filter(ImageFilter.MedianFilter(3))  # buang noise bintik

    angle = estimate_skew(img)
    if abs(angle) >= 0.2:
        img = img.rotate(angle, resample=BICUBIC, expand=True, fillcolor=255)

    longest = max(img.size)
    if longest < 2000:  # Tesseract paling akurat di sekitar 300 dpi
        scale = min(3.0, 2000 / longest)
        img = img.resize((int(img.width * scale), int(img.height * scale)), LANCZOS)
    elif longest > 4500:
        scale = 4000 / longest
        img = img.resize((int(img.width * scale), int(img.height * scale)), LANCZOS)

    img = ImageOps.autocontrast(img, cutoff=1)
    return img.filter(ImageFilter.SHARPEN)


# --------------------------------------------------------------------------- #
# OCR -> baris teks
# --------------------------------------------------------------------------- #


def words_to_lines(words: list[tuple[str, int, int, int, int]]) -> list[str]:
    """
    Gabungkan kata-kata yang sejajar secara vertikal menjadi satu baris, urut dari kiri.
    Lebih tahan terhadap formulir berbentuk tabel (label dan isi beda sel) dibanding
    pengelompokan baris bawaan Tesseract.
    """
    if not words:
        return []
    median_h = statistics.median(h for _, _, _, _, h in words)
    tolerance = max(4.0, median_h * 0.6)

    words = sorted(words, key=lambda w: w[2] + w[4] / 2)  # urut dari atas
    rows: list[list[tuple[str, int, int, int, int]]] = []
    centers: list[float] = []
    for w in words:
        yc = w[2] + w[4] / 2
        if rows and abs(yc - centers[-1]) <= tolerance:
            rows[-1].append(w)
            centers[-1] = sum(x[2] + x[4] / 2 for x in rows[-1]) / len(rows[-1])
        else:
            rows.append([w])
            centers.append(yc)

    lines = []
    for row in rows:
        row.sort(key=lambda w: w[1])  # urut dari kiri
        lines.append(" ".join(w[0] for w in row))
    return lines


def ocr_lines(img: Image.Image) -> list[str]:
    data = pytesseract.image_to_data(
        img, lang=LANG, config="--oem 1 --psm 6", output_type=Output.DICT, timeout=60
    )
    words = []
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if not text or float(data["conf"][i]) < 0:
            continue
        words.append((text, data["left"][i], data["top"][i], data["width"][i], data["height"][i]))
    return words_to_lines(words)


# --------------------------------------------------------------------------- #
# API
# --------------------------------------------------------------------------- #


@app.get("/health")
def health():
    return {"ok": True, "tesseract": str(pytesseract.get_tesseract_version()), "lang": LANG, "pdf": fitz is not None}


@app.post("/ocr/{page}", dependencies=[Depends(require_token)])
def ocr(page: int, file: UploadFile = File(...)):
    if page not in PAGES:
        raise HTTPException(404, "Lembar tidak dikenal (gunakan 1, 2, atau 3).")

    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File terlalu besar (maksimal 15 MB).")
    if not data:
        raise HTTPException(400, "File kosong.")

    img = preprocess(load_image(data))
    try:
        lines = ocr_lines(img)
    except RuntimeError:
        raise HTTPException(504, "OCR terlalu lama. Coba gambar yang lebih kecil atau lebih jelas.")

    fields = extract_fields(page, lines)
    return {
        "page": page,
        "fields": fields,
        "missing": expected_missing(page, fields),
        "text": "\n".join(lines),
    }