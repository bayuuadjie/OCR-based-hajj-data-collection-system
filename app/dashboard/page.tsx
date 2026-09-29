import type { Metadata } from "next";
import { demoJemaah, statusBadgeClass } from "@/lib/demo-jemaah";

export const metadata: Metadata = {
  title: "Dashboard - Sistem Pendataan Hajj & Umrah",
};

export default function DashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col gap-space-lg">
      {/* Header aksi */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-base">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">
            Data Rekapitulasi Jemaah
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Kelola dan rekapitulasi berkas pendaftaran jemaah haji &amp; umrah terverifikasi
            se-wilayah operasional.
          </p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap justify-end">
          <button className="h-10 px-space-base rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container hover:border-outline transition-colors duration-150 shadow-sm">
            <span className="material-symbols-outlined text-tertiary">table_view</span>
            <span>Export Excel (.xlsx)</span>
          </button>
          <button className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-primary transition-all duration-150 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Input Data Baru</span>
          </button>
        </div>
      </section>

      {/* Filter */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-base shadow-sm space-y-space-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-base">
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">date_range</span>
              Filter Tanggal Validasi
            </label>
            <div className="flex items-center gap-2">
              <input
                className="w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                title="Tanggal Mulai"
                type="text"
                defaultValue="01/01/2024"
              />
              <span className="text-outline font-medium text-body-sm">-</span>
              <input
                className="w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                title="Tanggal Akhir"
                type="text"
                defaultValue="31/12/2024"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">
              Cari Alamat / Nama Keluarga
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                location_on
              </span>
              <input
                className="w-full h-10 pl-9 pr-8 bg-surface rounded-lg border border-outline-variant text-body-sm placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                placeholder="Cari desa, RT/RW, atau marga..."
                type="text"
              />
              <button className="absolute right-2.5 text-outline hover:text-on-surface" title="Bersihkan">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">
              Status Haji
            </label>
            <select className="w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container cursor-pointer">
              <option value="all">Semua Status</option>
              <option value="terdaftar">Terdaftar</option>
              <option value="porsi_aktif">Porsi Aktif</option>
              <option value="reguler">Reguler</option>
              <option value="khusus">Khusus</option>
              <option value="lunas_tunda">Lunas Tunda</option>
              <option value="batal">Batal</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">
              Kecamatan
            </label>
            <select className="w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container cursor-pointer">
              <option value="">Semua Kecamatan</option>
              <option value="cibiru">Kec. Cibiru</option>
              <option value="antapani">Kec. Antapani</option>
              <option value="sukajadi">Kec. Sukajadi</option>
              <option value="tebet">Kec. Tebet</option>
              <option value="banyumanik">Kec. Banyumanik</option>
            </select>
          </div>
        </div>

        <div className="pt-space-xs border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant text-label-sm font-label-sm">
              <span className="material-symbols-outlined text-[15px] text-primary">sort</span>
              <span>Diurutkan: Tanggal Validasi &amp; Alamat</span>
            </div>
            <span className="text-label-sm font-label-sm text-outline">
              Ditemukan {demoJemaah.length} berkas
            </span>
          </div>
          <div className="flex items-center gap-space-xs justify-end">
            <button className="h-9 px-space-sm rounded-lg text-outline hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors duration-150">
              Reset
            </button>
            <button className="h-9 px-space-base rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-1 hover:bg-primary transition-colors duration-150">
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tabel data */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto enterprise-scroll w-full">
          <table className="w-full text-left border-collapse text-body-sm whitespace-nowrap min-w-[2100px]">
            <thead>
              <tr className="h-10 bg-surface border-b border-outline-variant text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="px-3.5 sticky left-0 bg-surface z-10 w-12 text-center border-r border-outline-variant">
                  #
                </th>
                <th className="px-3.5 py-2 font-semibold">Nama Lengkap</th>
                <th className="px-3.5 py-2 font-semibold">Bin/Binti</th>
                <th className="px-3.5 py-2 font-semibold">Alamat (RT/RW/Desa)</th>
                <th className="px-3.5 py-2 font-semibold">Kecamatan</th>
                <th className="px-3.5 py-2 font-semibold">No. Telepon</th>
                <th className="px-3.5 py-2 font-semibold">Tempat Lahir</th>
                <th className="px-3.5 py-2 font-semibold">Tgl Lahir</th>
                <th className="px-3.5 py-2 font-semibold">Status Haji</th>
                <th className="px-3.5 py-2 font-semibold">Pekerjaan</th>
                <th className="px-3.5 py-2 font-semibold">Pendidikan</th>
                <th className="px-3.5 py-2 font-semibold text-center">JK</th>
                <th className="px-3.5 py-2 font-semibold">Nama Bank</th>
                <th className="px-3.5 py-2 font-semibold font-mono">No. Rekening</th>
                <th className="px-3.5 py-2 font-semibold font-mono">No. Validasi</th>
                <th className="px-3.5 py-2 font-semibold font-mono">No. Porsi</th>
                <th className="px-3.5 py-2 font-semibold">Tgl Validasi</th>
                <th className="px-3.5 py-2 font-semibold">Tgl Porsi</th>
                <th className="px-3.5 py-2 font-semibold sticky right-0 bg-surface z-10 text-center border-l border-outline-variant w-24">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {demoJemaah.map((row, idx) => (
                <tr
                  key={row.noPorsi}
                  className="h-12 hover:bg-surface-container-low transition-colors duration-100 group"
                >
                  <td className="px-3.5 text-center sticky left-0 bg-surface-container-lowest group-hover:bg-surface-container-low z-10 text-outline border-r border-outline-variant font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="px-3.5 py-2 font-semibold text-on-surface">{row.namaLengkap}</td>
                  <td className="px-3.5 py-2 text-on-surface-variant">{row.binBinti}</td>
                  <td className="px-3.5 py-2 text-on-surface">{row.alamat}</td>
                  <td className="px-3.5 py-2 text-on-surface">{row.kecamatan}</td>
                  <td className="px-3.5 py-2 font-mono text-on-surface-variant">{row.telepon}</td>
                  <td className="px-3.5 py-2 text-on-surface">{row.tempatLahir}</td>
                  <td className="px-3.5 py-2 text-on-surface-variant">{row.tglLahir}</td>
                  <td className="px-3.5 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadgeClass(
                        row.statusHaji
                      )}`}
                    >
                      {row.statusHaji}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-on-surface-variant">{row.pekerjaan}</td>
                  <td className="px-3.5 py-2 text-on-surface-variant">{row.pendidikan}</td>
                  <td className="px-3.5 py-2 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        row.jk === "L"
                          ? "bg-surface-container text-primary"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {row.jk}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-on-surface">{row.namaBank}</td>
                  <td className="px-3.5 py-2 font-mono text-outline">{row.noRekening}</td>
                  <td className="px-3.5 py-2 font-mono font-medium text-primary">{row.noValidasi}</td>
                  <td className="px-3.5 py-2 font-mono font-semibold text-on-surface">{row.noPorsi}</td>
                  <td className="px-3.5 py-2 text-on-surface-variant">{row.tglValidasi}</td>
                  <td className="px-3.5 py-2 text-on-surface-variant">{row.tglPorsi}</td>
                  <td className="px-3.5 py-2 sticky right-0 bg-surface-container-lowest group-hover:bg-surface-container-low z-10 text-center border-l border-outline-variant">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                        title="Edit Data"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        className="p-1 rounded hover:bg-error-container text-outline hover:text-error transition-colors"
                        title="Hapus Data"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-space-base bg-surface border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm select-none">
          <div className="text-body-sm font-body-sm text-on-surface-variant">
            Menampilkan <span className="font-semibold text-on-surface">1-{demoJemaah.length}</span>{" "}
            dari <span className="font-semibold text-on-surface">{demoJemaah.length}</span> berkas
          </div>
          <div className="flex items-center gap-space-base flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                Baris per halaman:
              </span>
              <select className="h-8 px-2 bg-surface-container-lowest rounded border border-outline-variant text-label-sm font-label-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <button
                className="h-8 px-2.5 rounded border border-outline-variant bg-surface-container-lowest text-outline text-label-sm font-label-sm flex items-center gap-1 disabled:opacity-50"
                disabled
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Prev</span>
              </button>
              <button className="h-8 w-8 rounded bg-primary-container text-on-primary font-bold text-label-sm font-label-sm flex items-center justify-center shadow-sm">
                1
              </button>
              <button className="h-8 px-2.5 rounded border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container text-label-sm font-label-sm flex items-center gap-1 transition-colors">
                <span>Next</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </section>

      {/* Footer halaman */}
      <footer className="w-full py-space-md flex flex-col md:flex-row justify-between items-center gap-space-sm border-t border-outline-variant text-body-sm font-body-sm mt-auto">
        <span className="text-on-surface-variant text-center md:text-left">
          © {new Date().getFullYear()} Kementerian Agama RI - Sistem Pendataan Hajj &amp; Umrah
        </span>
        <div className="flex items-center gap-space-base flex-wrap justify-center">
          <a href="#privasi" className="text-on-surface-variant hover:text-primary transition-colors duration-150">
            Kebijakan Privasi
          </a>
          <a href="#syarat" className="text-on-surface-variant hover:text-primary transition-colors duration-150">
            Syarat &amp; Ketentuan
          </a>
          <a href="#status" className="text-on-surface-variant hover:text-primary transition-colors duration-150">
            Status Sistem
          </a>
        </div>
      </footer>
    </main>
  );
}