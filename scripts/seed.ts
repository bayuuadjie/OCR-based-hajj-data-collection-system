import "dotenv/config";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

type SeedAccount = {
  username: string;
  password: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
  email?: string;
};

const accounts: SeedAccount[] = [
  {
    username: "",
    password: "",
    name: "",
    role: "ADMIN",
    email: "",
  },
  {
    username: "",
    password: "",
    name: "",
    role: "OPERATOR",
    email: "",
  },
];

function validateAccounts() {
  const usernames = new Set<string>();
  const emails = new Set<string>();

  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index];
    const accountLabel = `Akun ke-${index + 1}`;
    if (!account.username.trim() || !account.password || !account.name.trim()) {
      throw new Error(
        `${accountLabel}: isi username, password, dan name di scripts/seed.ts sebelum menjalankan seed.`
      );
    }
    if (account.password.length < 8) {
      throw new Error(`${accountLabel}: password minimal 8 karakter.`);
    }
    if (Buffer.byteLength(account.password, "utf8") > 72) {
      throw new Error(`${accountLabel}: password melebihi 72 byte.`);
    }
    if (usernames.has(account.username)) {
      throw new Error(`${accountLabel}: username "${account.username}" digunakan lebih dari sekali.`);
    }
    usernames.add(account.username);

    const email = account.email?.trim();
    if (email && emails.has(email)) {
      throw new Error(`${accountLabel}: email "${email}" digunakan lebih dari sekali.`);
    }
    if (email) {
      emails.add(email);
    }
  }
}

async function main() {
  validateAccounts();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query("ALTER TABLE operators ADD COLUMN IF NOT EXISTS active_session_id TEXT");
    await pool.query("ALTER TABLE operators ADD COLUMN IF NOT EXISTS active_session_expires_at TIMESTAMPTZ");
    for (const acc of accounts) {
      const passwordHash = await bcrypt.hash(acc.password, 12);
      await pool.query(
        `INSERT INTO operators (id, username, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username)
         DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           active_session_id = NULL,
           active_session_expires_at = NULL,
           updated_at = now()`,
        [randomUUID(), acc.username, acc.email || null, acc.name, passwordHash, acc.role]
      );
      console.log(`✅ ${acc.username} (${acc.role}) siap.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});