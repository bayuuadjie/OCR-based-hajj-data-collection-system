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
//   {
//     username: "",
//     password: "",
//     name: "",
//     role: "",
//     email: "",
//   },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
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