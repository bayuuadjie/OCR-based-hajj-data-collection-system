"""
Mengubah baris-baris teks hasil OCR menjadi isian kolom jemaah.

Cara kerja: formulir berisi pasangan "Label : isi". Setiap baris dicocokkan dengan
daftar label (alias) tiap kolom secara fuzzy (toleran salah baca OCR), lalu isinya
dinormalkan (tanggal -> YYYY-MM-DD, nomor -> angka saja, dst).

Kalau label di formulir kamu berbeda, cukup ubah/tambah alias di PAGES di bawah.
File ini tidak butuh Tesseract, jadi bisa diuji sendiri.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Callable

from rapidfuzz import fuzz

# --------------------------------------------------------------------------- #
# Normalisasi nilai
# --------------------------------------------------------------------------- #

MONTHS = {
    "januari": 1, "jan": 1, "februari": 2, "pebruari": 2, "feb": 2, "maret": 3, "mar": 3,
    "april": 4, "apr": 4, "mei": 5, "juni": 6, "jun": 6, "juli": 7, "jul": 7,
    "agustus": 8, "agu": 8, "agt": 8, "ags": 8, "september": 9, "sep": 9, "sept": 9,
    "oktober": 10, "okt": 10, "november": 11, "nopember": 11, "nov": 11,
    "desember": 12, "des": 12,
}

_DIGIT_FIX = str.maketrans({"O": "0", "o": "0", "I": "1", "l": "1", "|": "1", "S": "5", "B": "8", "Z": "2"})


def clean_text(value: str) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    return value.strip(" :;=|_~`'\"\u201c\u201d\u2018\u2019\u00ab\u00bb<>")


def digits_only(value: str) -> str:
    """Untuk kolom angka: perbaiki salah baca huruf->angka lalu buang selain angka."""
    return re.sub(r"\D", "", (value or "").translate(_DIGIT_FIX))


def norm_phone(value: str) -> str:
    d = digits_only(value)
    if d.startswith("62"):
        d = "0" + d[2:]
    return d


def _valid_iso(y: int, m: int, d: int) -> str:
    try:
        return date(y, m, d).isoformat()
    except ValueError:
        return ""


def parse_date(value: str) -> str:
    """Kembalikan YYYY-MM-DD, atau "" kalau tidak bisa dibaca."""
    s = clean_text(value)
    if not s:
        return ""

    # 7 Juni 1999 / 07 JUN 1999
    m = re.search(r"(\d{1,2})\s*[-/. ]?\s*([A-Za-z]{3,10})\.?\s*[-/. ]?\s*(\d{4})", s)
    if m and m.group(2).lower() in MONTHS:
        return _valid_iso(int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))

    # Angka: buang salah baca huruf->angka (O->0, l->1) lalu cari pola tanggal
    t = s.translate(_DIGIT_FIX)

    m = re.search(r"(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})", t)  # 1999-06-07
    if m:
        return _valid_iso(int(m.group(1)), int(m.group(2)), int(m.group(3)))

    # 07/06/1999 (tahun 4 digit dicoba dulu), lalu 07/06/99. Semua kecocokan dicoba
    # karena titik dua yang salah baca jadi "1" bisa menggeser kecocokan pertama.
    for pattern in (r"(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})(?!\d)",
                    r"(\d{1,2})\s*[-/.\s]\s*(\d{1,2})\s*[-/.\s]\s*(\d{4}|\d{2})(?!\d)"):
        for m in re.finditer(pattern, t):
            yy = int(m.group(3))
            if len(m.group(3)) == 2:
                yy += 2000 if yy <= 30 else 1900
            iso = _valid_iso(yy, int(m.group(2)), int(m.group(1)))
            if iso:
                return iso

    m = re.search(r"(?<!\d)(\d{2})(\d{2})(\d{4})(?!\d)", t)  # 07061999 (tanpa pemisah)
    if m:
        return _valid_iso(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    return ""


def norm_gender(value: str) -> str:
    v = re.sub(r"[^a-z]", "", (value or "").lower())
    if v in {"l", "lk", "laki", "lakilaki", "pria", "male", "m"} or v.startswith("laki"):
        return "L"
    if v in {"p", "pr", "perempuan", "wanita", "female", "f"} or v.startswith("perempuan"):
        return "P"
    return ""


def norm_pernah_haji(value: str) -> str:
    v = (value or "").lower()
    if "belum" in v or "tidak" in v or v.strip() in {"b", "no"}:
        return "Belum"
    if "sudah" in v or "pernah" in v or v.strip() in {"s", "ya", "yes"}:
        return "Sudah"
    return ""


def norm_alamat(value: str) -> str:
    """Perbaiki salah baca O/l di dalam angka, mis. "RT O4/RW O2" -> "RT 04/RW 02"."""
    v = clean_text(value)
    v = re.sub(r"(?<=\d)[Oo]|[Oo](?=\d)", "0", v)
    return re.sub(r"(?<=\d)[lI|]|[lI|](?=\d)", "1", v)


def norm_pendidikan(value: str) -> str:
    """Perbaiki "Sl"/"$1"/"SI" di awal menjadi "S1" (jenjang pendidikan)."""
    v = clean_text(value)
    return re.sub(r"^[S$5s]\s?[lI|!1](?=\s|$)", "S1", v)


def norm_kecamatan(value: str) -> str:
    v = clean_text(re.sub(r"^\s*(kecamatan|kec)\b\.?", "", value or "", flags=re.I))
    return f"Kec. {v.title()}" if v else ""


_BANKS = {
    "bsi": "Bank Syariah Indonesia", "syariah indonesia": "Bank Syariah Indonesia",
    "bni": "Bank Negara Indonesia", "bri": "Bank Rakyat Indonesia",
    "bca": "Bank Central Asia", "btn": "Bank Tabungan Negara", "bjb": "Bank BJB",
    "mandiri": "Bank Mandiri", "muamalat": "Bank Muamalat",
}


def norm_bank(value: str) -> str:
    v = clean_text(value)
    key = re.sub(r"^bank\s+", "", v, flags=re.I).lower()
    return _BANKS.get(key, v)


def norm_father(value: str) -> str:
    """Nama ayah tanpa awalan Bin/Binti (awalan ditambahkan di form sesuai jenis kelamin)."""
    return clean_text(re.sub(r"^\s*(binti|bin|bn|bt)\b\.?", "", value or "", flags=re.I))


# --------------------------------------------------------------------------- #
# Daftar kolom per lembar
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class Spec:
    key: str  # sama dengan nama kolom di form frontend (camelCase)
    aliases: tuple[str, ...]  # tulisan label yang mungkin muncul di formulir
    normalize: Callable[[str], str] = clean_text
    multiline: bool = False  # isi bisa lebih dari satu baris (alamat)
    optional: bool = False  # tidak dianggap "tidak terbaca" kalau kosong


PAGES: dict[int, list[Spec]] = {
    # Lembar 1: data diri, porsi, bank
    1: [
        Spec("namaLengkap", ("nama", "nama lengkap", "nama jemaah", "nama calon jemaah")),
        Spec("namaAyah", ("nama ayah kandung", "nama ayah", "ayah kandung", "bin/binti", "bin binti", "nama orang tua"), norm_father),
        Spec("jenisKelamin", ("jenis kelamin", "kelamin", "jk"), norm_gender),
        Spec("tempatLahir", ("tempat lahir", "tmp lahir")),
        Spec("tanggalLahir", ("tanggal lahir", "tgl lahir", "tgl. lahir"), parse_date),
        Spec("kecamatan", ("kecamatan", "kec"), norm_kecamatan),
        Spec("noTelepon", ("nomor hp", "no hp", "no. hp", "nomor telepon", "no telepon", "no telp", "nomor handphone", "no handphone", "nomor wa", "telepon", "hp"), norm_phone),
        Spec("noPorsi", ("nomor porsi", "no porsi", "no. porsi", "porsi"), digits_only),
        Spec("tanggalPorsi", ("tanggal porsi", "tgl porsi", "tgl. porsi"), parse_date),
        Spec("namaBank", ("nama bank", "bank"), norm_bank),
        Spec("noRekening", ("nomor rekening", "no rekening", "no. rekening", "no rek", "rekening"), digits_only),
    ],
    # Lembar 2: status haji & validasi
    2: [
        Spec("pernahHaji", ("status haji", "pernah haji", "sudah haji", "status"), norm_pernah_haji, optional=True),
        Spec("noValidasi", ("nomor validasi", "no validasi", "no. validasi", "validasi"), digits_only),
        Spec("tanggalValidasi", ("tanggal validasi", "tgl validasi", "tgl. validasi"), parse_date),
    ],
    # Lembar 3: alamat, pendidikan, pekerjaan
    3: [
        Spec("alamat", ("alamat lengkap", "alamat rumah", "alamat tinggal", "alamat"), norm_alamat, multiline=True),
        Spec("pendidikan", ("pendidikan terakhir", "pendidikan"), norm_pendidikan),
        Spec("pekerjaan", ("jenis pekerjaan", "pekerjaan")),
    ],
}

# Beberapa formulir menulis "Tempat/Tanggal Lahir : Bandung, 14-08-1972" dalam satu baris.
_TTL_ALIASES = ("tempat tanggal lahir", "tempat tgl lahir", "tempat dan tanggal lahir", "ttl", "tempat/tanggal lahir")

# --------------------------------------------------------------------------- #
# Pencocokan label
# --------------------------------------------------------------------------- #


def _n(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


@dataclass
class _Match:
    key: str
    value: str
    score: float
    alias_len: int


def _best_match(line: str, specs: list[tuple[str, tuple[str, ...]]]) -> _Match | None:
    """Cari kolom yang labelnya paling cocok dengan awal baris ini."""
    best: _Match | None = None

    def consider(key: str, alias: str, score: float, value: str) -> None:
        nonlocal best
        # Alias pendek (hp, jk, kec) harus persis agar tidak salah cocok
        need = 100 if len(_n(alias)) <= 3 else 82
        if score < need:
            return
        cand = _Match(key, value, score, len(_n(alias)))
        if best is None or (cand.score, cand.alias_len) > (best.score, best.alias_len):
            best = cand

    # 1) Ada pemisah ":" / ";" / "=" -> label di kiri, isi di kanan
    m = re.search(r"[:;=]", line)
    if m:
        label, value = line[: m.start()], line[m.end():]
        if len(label.split()) <= 6:
            for key, aliases in specs:
                for alias in aliases:
                    consider(key, alias, fuzz.ratio(_n(label), _n(alias)), value)

    # 2) Tanpa pemisah (sel tabel) -> beberapa kata pertama adalah label
    tokens = line.split()
    for key, aliases in specs:
        for alias in aliases:
            n_words = len(alias.split())
            for k in {max(1, n_words - 1), n_words, n_words + 1}:
                if k > len(tokens):
                    continue
                label = " ".join(tokens[:k])
                consider(key, alias, fuzz.ratio(_n(label), _n(alias)), " ".join(tokens[k:]))
    return best


def extract_fields(page: int, lines: list[str]) -> dict[str, str]:
    """Kembalikan {namaKolom: nilai}. Kolom yang tidak ketemu bernilai ""."""
    specs = PAGES[page]
    by_key = {s.key: s for s in specs}
    result = {s.key: "" for s in specs}

    lookup = [(s.key, s.aliases) for s in specs]
    if page == 1:
        lookup.append(("_ttl", _TTL_ALIASES))

    clean_lines = [clean_text(l) for l in lines]
    clean_lines = [l for l in clean_lines if l]
    raw: dict[str, str] = {}
    used: set[int] = set()

    def is_label_line(text: str) -> bool:
        return _best_match(text, lookup) is not None

    for i, line in enumerate(clean_lines):
        if i in used:
            continue
        match = _best_match(line, lookup)
        if match is None or match.key in raw:
            continue

        value = match.value.strip(" :;=|_.-")
        tokens = value.split()
        if len(tokens) > 1 and tokens[0] in {"1", "|", "!", ".", ",", "-", "_", "~"}:
            value = " ".join(tokens[1:])  # titik dua yang salah baca
        spec = by_key.get(match.key)

        # Isi ada di baris berikutnya (label berdiri sendiri)
        if not value and i + 1 < len(clean_lines) and not is_label_line(clean_lines[i + 1]):
            value = clean_lines[i + 1]
            used.add(i + 1)

        # Alamat: sambung baris-baris berikutnya sampai ketemu label lain
        if spec and spec.multiline:
            parts = [value] if value else []
            j = i + 1
            while j < len(clean_lines) and len(parts) < 4 and not is_label_line(clean_lines[j]):
                if j not in used:
                    parts.append(clean_lines[j])
                    used.add(j)
                j += 1
            value = " ".join(parts)

        raw[match.key] = value

    for key, value in raw.items():
        if key in by_key:
            result[key] = by_key[key].normalize(value)

    # Pecah "Tempat/Tanggal Lahir" kalau kolom terpisahnya kosong
    ttl = raw.get("_ttl", "")
    if ttl and page == 1:
        iso = parse_date(ttl)
        if iso and not result["tanggalLahir"]:
            result["tanggalLahir"] = iso
        if not result["tempatLahir"]:
            place = re.split(r"[,;]|\s\d", ttl, maxsplit=1)[0]
            result["tempatLahir"] = clean_text(place)

    return result


def expected_missing(page: int, fields: dict[str, str]) -> list[str]:
    """Kolom wajib baca yang kosong (untuk ditandai di layar)."""
    return [s.key for s in PAGES[page] if not s.optional and not fields.get(s.key)]