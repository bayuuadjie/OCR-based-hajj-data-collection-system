DO $$ BEGIN
  CREATE TYPE operator_role AS ENUM ('ADMIN', 'OPERATOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS operators (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          operator_role NOT NULL DEFAULT 'OPERATOR',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);