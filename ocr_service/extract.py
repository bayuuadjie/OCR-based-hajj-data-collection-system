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


_MONTH_NAMES = (
    "januari", "februari", "pebruari", "maret", "april", "mei", "juni",
    "juli", "agustus", "september", "oktober", "november", "nopember", "desember",
)
_NUMFIX = str.maketrans({"O": "0", "o": "0", "I": "1", "l": "1", "|": "1"})


def _month_of(token: str) -> int | None:
    """Nomor bulan dari tulisan seperti "Juni", "Jun", "Agt", atau salah baca "Agusuts"."""
    t = token.lower().strip(".")
    if t in MONTHS:
        return MONTHS[t]
    if len(t) < 4:  # singkatan 3 huruf harus persis
        return None
    best: dict[int, float] = {}
    for name in _MONTH_NAMES:
        best[MONTHS[name]] = max(best.get(MONTHS[name], 0), fuzz.ratio(t, name))
    ranked = sorted(best.items(), key=lambda kv: kv[1], reverse=True)
    # Harus cukup mirip DAN jelas lebih mirip satu bulan dibanding bulan lain (Juni vs Juli)
    if ranked[0][1] >= 75 and ranked[0][1] > ranked[1][1]:
        return ranked[0][0]
    return None


def _year_of(text: str) -> int:
    year = int(text.translate(_NUMFIX))
    if len(text) == 2:
        year += 2000 if year <= 30 else 1900
    return year


def _parse_iso(value: str) -> str:
    """Kembalikan YYYY-MM-DD, atau "" kalau tidak bisa dibaca."""
    s = clean_text(value)
    if not s:
        return ""

    # Dengan nama bulan: "07 Juni 2022", "7-Jun-22", "07Juni2022", "O7 Juni 2O22"
    for m in re.finditer(r"[A-Za-z]{3,10}", s):
        month = _month_of(m.group())
        if month is None:
            continue
        day = re.search(r"(?<![A-Za-z])([0-9OoIl|]{1,2})\W*$", s[: m.start()])
        year = re.match(r"\W*([0-9OoIl|]{4}|[0-9OoIl|]{2})(?![A-Za-z0-9])", s[m.end():])
        if day and year:
            iso = _valid_iso(_year_of(year.group(1)), month, int(day.group(1).translate(_NUMFIX)))
            if iso:
                return iso

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


def parse_date(value: str) -> str:
    """Tanggal dalam bentuk apa pun -> dd/mm/yyyy (mis. "07 Juni 2022" -> "07/06/2022"), atau ""."""
    iso = _parse_iso(value)
    if not iso:
        return ""
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


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


def norm_rtrw(value: str) -> str:
    """"004/002" / "RT 04 / RW 02" -> "RT 004/RW 002" (salah baca O/l di angka diperbaiki)."""
    nums = re.findall(r"(?<![A-Za-z])[0-9OoIl|]{1,4}(?![A-Za-z])", value or "")
    nums = [n.translate(_NUMFIX) for n in nums]
    if len(nums) >= 2:
        return f"RT {nums[0]}/RW {nums[1]}"
    return clean_text(value)


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
        Spec("tanggalPorsi", ("tanggal set", "tanggal setor", "tgl set", "tgl setor", "tanggal porsi", "tgl porsi"), parse_date),
        Spec("namaBank", ("nama bank", "bank"), norm_bank),
        Spec("noRekening", ("nomor rekening", "no rekening", "no. rekening", "no rek", "rekening"), digits_only),
    ],
    # Lembar 2: status haji & validasi
    2: [
        Spec("pernahHaji", ("status haji", "pernah haji", "sudah haji", "status"), norm_pernah_haji, optional=True),
        Spec("noValidasi", ("nomor validasi", "no validasi", "no. validasi", "validasi"), digits_only),
        Spec("tanggalValidasi", ("tanggal validasi", "tgl validasi", "tgl. validasi"), parse_date),
    ],
    # Lembar 3: alamat = gabungan label "RT/RW" dan "Desa/Kelurahan".
    # (Pendidikan & pekerjaan sengaja tidak di-OCR: datanya dari KK dan isinya beberapa orang.)
    # Kunci berawalan "_" hanya bahan; hasil akhirnya satu kolom "alamat".
    3: [
        Spec("_rtrw", ("rt/rw", "rt / rw", "rt rw", "rtrw"), norm_rtrw),
        Spec("_desa", ("desa/kelurahan", "desa / kelurahan", "desa kelurahan", "kelurahan/desa", "kel/desa", "kelurahan", "desa")),
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


def output_keys(page: int) -> list[str]:
    """Kolom hasil akhir untuk lembar ini (tanpa kunci bahan berawalan "_")."""
    keys = [s.key for s in PAGES[page] if not s.key.startswith("_")]
    return keys + ["alamat"] if page == 3 else keys


def extract_fields(page: int, lines: list[str]) -> dict[str, str]:
    """Kembalikan {namaKolom: nilai}. Kolom yang tidak ketemu bernilai ""."""
    specs = PAGES[page]
    by_key = {s.key: s for s in specs}

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

        # Isi ada di baris berikutnya (label berdiri sendiri, mis. "Tanggal Set." lalu tanggalnya di bawah)
        if not value and i + 1 < len(clean_lines) and not is_label_line(clean_lines[i + 1]):
            value = clean_lines[i + 1]
            used.add(i + 1)

        raw[match.key] = value

    normalized = {key: by_key[key].normalize(value) for key, value in raw.items() if key in by_key}
    result = {key: normalized.get(key, "") for key in output_keys(page)}

    if page == 3:
        parts = [normalized.get("_rtrw", ""), normalized.get("_desa", "")]
        result["alamat"] = ", ".join(p for p in parts if p)

    # Pecah "Tempat/Tanggal Lahir" kalau kolom terpisahnya kosong
    ttl = raw.get("_ttl", "")
    if ttl and page == 1:
        tgl = parse_date(ttl)
        if tgl and not result["tanggalLahir"]:
            result["tanggalLahir"] = tgl
        if not result["tempatLahir"]:
            place = re.split(r"[,;]|\s\d", ttl, maxsplit=1)[0]
            result["tempatLahir"] = clean_text(place)

    return result


def expected_missing(page: int, fields: dict[str, str]) -> list[str]:
    """Kolom wajib baca yang kosong (untuk ditandai di layar)."""
    optional = {s.key for s in PAGES[page] if s.optional}
    return [k for k in output_keys(page) if k not in optional and not fields.get(k)]