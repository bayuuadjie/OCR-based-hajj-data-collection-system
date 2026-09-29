import "dotenv/config";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

async function main() {
  const [username, password, name, roleArg, email] = process.argv.slice(2);

  if (!username || !password || !name) {
    console.error(
      'Pemakaian: npm run db:create-user -- <username> <password> "<Nama Lengkap>" [ADMIN|OPERATOR] [email]'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exit(1);
  }

  const role = roleArg === "ADMIN" ? "ADMIN" : "OPERATOR";
  const passwordHash = await bcrypt.hash(password, 12);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
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
      [randomUUID(), username, email || null, name, passwordHash, role]
    );
    console.log(
      `✅ Akun "${username}" (${role}) siap dipakai. Password TIDAK ditampilkan lagi, catat sekarang.`
    );
  } catch (err) {
    console.error("Gagal membuat akun:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();