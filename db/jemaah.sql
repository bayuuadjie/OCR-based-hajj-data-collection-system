-- Jalankan: psql "$DATABASE_URL" -f db/jemaah.sql

CREATE TABLE IF NOT EXISTS jemaah (
  id               TEXT PRIMARY KEY,
  nama_lengkap     TEXT NOT NULL,
  bin_binti        TEXT NOT NULL,
  alamat           TEXT NOT NULL,
  kecamatan        TEXT,
  no_telepon       TEXT,
  tempat_lahir     TEXT,
  tanggal_lahir    DATE,
  pernah_haji      TEXT NOT NULL DEFAULT 'Belum' CHECK (pernah_haji IN ('Sudah', 'Belum')),
  pekerjaan        TEXT,
  pendidikan       TEXT,
  jenis_kelamin    CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
  nama_bank        TEXT,
  no_rekening      TEXT,
  no_validasi      TEXT,
  no_porsi         TEXT NOT NULL UNIQUE,
  tanggal_validasi DATE,
  tanggal_porsi    DATE,
  created_by       TEXT REFERENCES operators(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jemaah_tanggal_validasi ON jemaah (tanggal_validasi);
CREATE INDEX IF NOT EXISTS idx_jemaah_kecamatan ON jemaah (kecamatan);
CREATE INDEX IF NOT EXISTS idx_jemaah_pernah_haji ON jemaah (pernah_haji);