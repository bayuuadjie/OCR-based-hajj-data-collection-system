export type JemaahRecord = {
  namaLengkap: string;
  binBinti: string;
  alamat: string;
  kecamatan: string;
  telepon: string;
  tempatLahir: string;
  tglLahir: string;
  statusHaji: "Reguler" | "Khusus" | "Lunas Tunda" | "Terdaftar" | "Batal";
  pekerjaan: string;
  pendidikan: string;
  jk: "L" | "P";
  namaBank: string;
  noRekening: string;
  noValidasi: string;
  noPorsi: string;
  tglValidasi: string;
  tglPorsi: string;
};

// TODO: ganti dengan data asli dari database setelah endpoint jemaah dibuat.
export const demoJemaah: JemaahRecord[] = [
  {
    namaLengkap: "H. Muhammad Ridwan Saleh",
    binBinti: "Bin H. Saleh Arifin",
    alamat: "RT 04/RW 02, Desa Sindangjaya",
    kecamatan: "Kec. Cibiru",
    telepon: "0812-8921-4401",
    tempatLahir: "Bandung",
    tglLahir: "14-08-1972",
    statusHaji: "Reguler",
    pekerjaan: "PNS Guru Madya",
    pendidikan: "S1 Pendidikan",
    jk: "L",
    namaBank: "Bank Syariah Indonesia",
    noRekening: "7182903112",
    noValidasi: "3273190241",
    noPorsi: "1000847291",
    tglValidasi: "04-03-2024",
    tglPorsi: "12-03-2024",
  },
  {
    namaLengkap: "Hj. Siti Aminah Masturoh",
    binBinti: "Binti KH. Masduki",
    alamat: "RT 01/RW 07, Kel. Antapani Wetan",
    kecamatan: "Kec. Antapani",
    telepon: "0857-2290-7813",
    tempatLahir: "Tasikmalaya",
    tglLahir: "29-11-1976",
    statusHaji: "Reguler",
    pekerjaan: "Wiraswasta Tekstil",
    pendidikan: "SMA/Sederajat",
    jk: "P",
    namaBank: "Bank Syariah Indonesia",
    noRekening: "7024192083",
    noValidasi: "3273190242",
    noPorsi: "1000847292",
    tglValidasi: "04-03-2024",
    tglPorsi: "12-03-2024",
  },
  {
    namaLengkap: "dr. Bambang Sutrisno, Sp.PD",
    binBinti: "Bin Sutrisno Wardoyo",
    alamat: "Jl. Sukajadi No. 142, RT 03/05",
    kecamatan: "Kec. Sukajadi",
    telepon: "0811-2093-412",
    tempatLahir: "Semarang",
    tglLahir: "05-02-1968",
    statusHaji: "Khusus",
    pekerjaan: "Dokter Spesialis",
    pendidikan: "Spesialis (S2)",
    jk: "L",
    namaBank: "Bank Muamalat",
    noRekening: "1092837461",
    noValidasi: "3273190884",
    noPorsi: "1000851004",
    tglValidasi: "10-03-2024",
    tglPorsi: "15-03-2024",
  },
  {
    namaLengkap: "Dewi Kartika Sari, M.Pd",
    binBinti: "Binti R. Sudrajat",
    alamat: "Komplek Tebet Barat IV No. 12",
    kecamatan: "Kec. Tebet",
    telepon: "0813-1829-5021",
    tempatLahir: "Jakarta Selatan",
    tglLahir: "18-09-1984",
    statusHaji: "Reguler",
    pekerjaan: "Dosen Tetap",
    pendidikan: "Magister (S2)",
    jk: "P",
    namaBank: "Bank Syariah Indonesia",
    noRekening: "7155620914",
    noValidasi: "3174092102",
    noPorsi: "1000854490",
    tglValidasi: "18-03-2024",
    tglPorsi: "22-03-2024",
  },
  {
    namaLengkap: "Achmad Nuril Huda",
    binBinti: "Bin H. Abdullah Syukri",
    alamat: "RT 02/RW 03, Kel. Pedalangan",
    kecamatan: "Kec. Banyumanik",
    telepon: "0821-3490-1128",
    tempatLahir: "Kudus",
    tglLahir: "22-06-1981",
    statusHaji: "Lunas Tunda",
    pekerjaan: "Karyawan BUMN",
    pendidikan: "Sarjana (S1)",
    jk: "L",
    namaBank: "Bank Syariah Indonesia",
    noRekening: "7099415201",
    noValidasi: "3374189033",
    noPorsi: "1000860211",
    tglValidasi: "25-03-2024",
    tglPorsi: "29-03-2024",
  },
  {
    namaLengkap: "Khadijah Nurul Aini",
    binBinti: "Binti Mahfud Siddiq",
    alamat: "RT 05/RW 01, Desa Cipadung",
    kecamatan: "Kec. Cibiru",
    telepon: "0896-7781-9032",
    tempatLahir: "Bandung",
    tglLahir: "10-10-1990",
    statusHaji: "Reguler",
    pekerjaan: "Apoteker Klinis",
    pendidikan: "Profesi Apoteker",
    jk: "P",
    namaBank: "Bank Syariah Indonesia",
    noRekening: "7192038475",
    noValidasi: "3273191105",
    noPorsi: "1000865912",
    tglValidasi: "02-04-2024",
    tglPorsi: "08-04-2024",
  },
  {
    namaLengkap: "Ir. Raden Suryadi Broto",
    binBinti: "Bin RM. Sosrokusumo",
    alamat: "Jl. Sukajadi Atas No. 89",
    kecamatan: "Kec. Sukajadi",
    telepon: "0812-9901-2384",
    tempatLahir: "Yogyakarta",
    tglLahir: "01-05-1965",
    statusHaji: "Khusus",
    pekerjaan: "Konsultan Konstruksi",
    pendidikan: "Magister Teknik (S2)",
    jk: "L",
    namaBank: "Bank Muamalat",
    noRekening: "1039485721",
    noValidasi: "3273191430",
    noPorsi: "1000869103",
    tglValidasi: "15-04-2024",
    tglPorsi: "20-04-2024",
  },
  {
    namaLengkap: "Fatimah Azzahra, S.Farm",
    binBinti: "Binti H. Usman Harun",
    alamat: "RT 03/RW 09, Antapani Tengah",
    kecamatan: "Kec. Antapani",
    telepon: "0852-6712-4490",
    tempatLahir: "Cirebon",
    tglLahir: "12-12-1994",
    statusHaji: "Reguler",
    pekerjaan: "Peneliti Farmasi",
    pendidikan: "Sarjana (S1)",
    jk: "P",
    namaBank: "Bank Syariah Indonesia",
    noRekening: "7088912349",
    noValidasi: "3273191992",
    noPorsi: "1000871145",
    tglValidasi: "25-04-2024",
    tglPorsi: "30-04-2024",
  },
];

export function statusBadgeClass(status: JemaahRecord["statusHaji"]) {
  switch (status) {
    case "Reguler":
      return "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim";
    case "Khusus":
      return "bg-secondary-container text-on-secondary-container border border-secondary-fixed";
    case "Lunas Tunda":
      return "bg-surface-container-highest text-primary border border-outline-variant";
    case "Batal":
      return "bg-error-container text-on-error-container border border-error/30";
    default:
      return "bg-surface-container text-on-surface-variant border border-outline-variant";
  }
}