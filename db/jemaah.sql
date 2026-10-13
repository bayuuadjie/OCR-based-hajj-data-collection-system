-- Jalankan sekali:
--   psql "$DATABASE_URL" -f db/jemaah.sql

CREATE TABLE IF NOT EXISTS jemaah (
  id               TEXT PRIMARY KEY,
  nama_lengkap     TEXT NOT NULL,
  bin_binti        TEXT,
  nik              TEXT UNIQUE,
  alamat           TEXT,
  kecamatan        TEXT,
  no_telepon       TEXT,
  tempat_lahir     TEXT,
  tanggal_lahir    DATE,
  status_haji      TEXT NOT NULL DEFAULT 'Terdaftar',
  pekerjaan        TEXT,
  pendidikan       TEXT,
  jenis_kelamin    CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
  nama_bank        TEXT,
  no_rekening      TEXT,
  no_validasi      TEXT,
  no_porsi         TEXT UNIQUE,
  tanggal_validasi DATE,
  tanggal_porsi    DATE,
  created_by       TEXT REFERENCES operators(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jemaah_tanggal_validasi ON jemaah (tanggal_validasi);
CREATE INDEX IF NOT EXISTS idx_jemaah_kecamatan ON jemaah (kecamatan);
CREATE INDEX IF NOT EXISTS idx_jemaah_status_haji ON jemaah (status_haji);