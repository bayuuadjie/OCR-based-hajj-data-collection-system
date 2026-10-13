//Jalankan: npm run db:seed-jemaah
import "dotenv/config";
import { randomUUID } from "crypto";
import { Pool } from "pg";

const BSI = "Bank Syariah Indonesia";
const MUAMALAT = "Bank Muamalat";

type Row = [
  string, // nama_lengkap
  string, // bin_binti
  string, // alamat
  string, // kecamatan
  string, // no_telepon
  string, // tempat_lahir
  string, // tanggal_lahir (YYYY-MM-DD)
  string, // status_haji
  string, // pekerjaan
  string, // pendidikan
  "L" | "P", // jenis_kelamin
  string, // nama_bank
  string, // no_rekening
  string, // no_validasi
  string, // no_porsi
  string, // tanggal_validasi
  string // tanggal_porsi
];

const rows: Row[] = [
  ["H. Muhammad Ridwan Saleh", "Bin H. Saleh Arifin", "RT 04/RW 02, Desa Sindangjaya", "Kec. Cibiru", "0812-8921-4401", "Bandung", "1972-08-14", "Reguler", "PNS Guru Madya", "S1 Pendidikan", "L", BSI, "7182903112", "3273190241", "1000847291", "2024-03-04", "2024-03-12"],
  ["Hj. Siti Aminah Masturoh", "Binti KH. Masduki", "RT 01/RW 07, Kel. Antapani Wetan", "Kec. Antapani", "0857-2290-7813", "Tasikmalaya", "1976-11-29", "Reguler", "Wiraswasta Tekstil", "SMA/Sederajat", "P", BSI, "7024192083", "3273190242", "1000847292", "2024-03-04", "2024-03-12"],
  ["dr. Bambang Sutrisno, Sp.PD", "Bin Sutrisno Wardoyo", "Jl. Sukajadi No. 142, RT 03/05", "Kec. Sukajadi", "0811-2093-412", "Semarang", "1968-02-05", "Khusus", "Dokter Spesialis", "Spesialis (S2)", "L", MUAMALAT, "1092837461", "3273190884", "1000851004", "2024-03-10", "2024-03-15"],
  ["Dewi Kartika Sari, M.Pd", "Binti R. Sudrajat", "Komplek Tebet Barat IV No. 12", "Kec. Tebet", "0813-1829-5021", "Jakarta Selatan", "1984-09-18", "Reguler", "Dosen Tetap", "Magister (S2)", "P", BSI, "7155620914", "3174092102", "1000854490", "2024-03-18", "2024-03-22"],
  ["Achmad Nuril Huda", "Bin H. Abdullah Syukri", "RT 02/RW 03, Kel. Pedalangan", "Kec. Banyumanik", "0821-3490-1128", "Kudus", "1981-06-22", "Lunas Tunda", "Karyawan BUMN", "Sarjana (S1)", "L", BSI, "7099415201", "3374189033", "1000860211", "2024-03-25", "2024-03-29"],
  ["Khadijah Nurul Aini", "Binti Mahfud Siddiq", "RT 05/RW 01, Desa Cipadung", "Kec. Cibiru", "0896-7781-9032", "Bandung", "1990-10-10", "Reguler", "Apoteker Klinis", "Profesi Apoteker", "P", BSI, "7192038475", "3273191105", "1000865912", "2024-04-02", "2024-04-08"],
  ["Ir. Raden Suryadi Broto", "Bin RM. Sosrokusumo", "Jl. Sukajadi Atas No. 89", "Kec. Sukajadi", "0812-9901-2384", "Yogyakarta", "1965-05-01", "Khusus", "Konsultan Konstruksi", "Magister Teknik (S2)", "L", MUAMALAT, "1039485721", "3273191430", "1000869103", "2024-04-15", "2024-04-20"],
  ["Fatimah Azzahra, S.Farm", "Binti H. Usman Harun", "RT 03/RW 09, Antapani Tengah", "Kec. Antapani", "0852-6712-4490", "Cirebon", "1994-12-12", "Reguler", "Peneliti Farmasi", "Sarjana (S1)", "P", BSI, "7088912349", "3273191992", "1000871145", "2024-04-25", "2024-04-30"],
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0;

  try {
    for (const r of rows) {
      const result = await pool.query(
        `INSERT INTO jemaah (
           id, nama_lengkap, bin_binti, alamat, kecamatan, no_telepon, tempat_lahir,
           tanggal_lahir, status_haji, pekerjaan, pendidikan, jenis_kelamin, nama_bank,
           no_rekening, no_validasi, no_porsi, tanggal_validasi, tanggal_porsi
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (no_porsi) DO NOTHING`,
        [randomUUID(), ...r]
      );
      inserted += result.rowCount ?? 0;
    }
    console.log(`✅ ${inserted} data baru dimasukkan (${rows.length - inserted} sudah ada).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed jemaah gagal:", err);
  process.exit(1);
});