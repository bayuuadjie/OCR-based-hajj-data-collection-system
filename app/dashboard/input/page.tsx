"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import KecamatanField, { normalizeKecamatan } from "@/components/dashboard/KecamatanField";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type FieldKey =
  | "namaLengkap" | "namaAyah" | "jenisKelamin" | "tempatLahir" | "tanggalLahir" | "kecamatan"
  | "noTelepon" | "noPorsi" | "tanggalPorsi" | "namaBank" | "noRekening"
  | "pernahHaji" | "noValidasi" | "tanggalValidasi"
  | "alamat" | "pendidikan" | "pekerjaan";

type FormState = Record<FieldKey, string>;

type FieldDef = {
  key: FieldKey;
  label: string;
  kind?: "text" | "date" | "tel" | "select" | "textarea" | "combo";
  options?: { value: string; label: string }[];
  required?: boolean;
  wide?: boolean;
  inputMode?: "numeric" | "tel";
};

type Sheet = { page: 1 | 2 | 3; title: string; subtitle: string; fields: FieldDef[] };

const SHEETS: Sheet[] = [
  {
    page: 1,
    title: "Lembar 1",
    subtitle: "Data diri, nomor porsi, dan rekening",
    fields: [
      { key: "namaLengkap", label: "Nama", required: true, wide: true },
      { key: "namaAyah", label: "Nama Ayah Kandung", required: true, wide: true },
      {
        key: "jenisKelamin", label: "Jenis Kelamin", kind: "select", required: true,
        options: [{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }],
      },
      { key: "tempatLahir", label: "Tempat Lahir" },
      { key: "tanggalLahir", label: "Tanggal Lahir", kind: "date" },
      { key: "kecamatan", label: "Kecamatan", kind: "combo" },
      { key: "noTelepon", label: "Nomor HP", kind: "tel", inputMode: "tel" },
      { key: "noPorsi", label: "Nomor Porsi", required: true, inputMode: "numeric" },
      { key: "tanggalPorsi", label: "Tanggal Porsi", kind: "date" },
      { key: "namaBank", label: "Nama Bank" },
      { key: "noRekening", label: "Nomor Rekening", inputMode: "numeric" },
    ],
  },
  {
    page: 2,
    title: "Lembar 2",
    subtitle: "Status haji dan validasi",
    fields: [
      {
        key: "pernahHaji", label: "Status Haji", kind: "select",
        options: [{ value: "Belum", label: "Belum" }, { value: "Sudah", label: "Sudah" }],
      },
      { key: "noValidasi", label: "Nomor Validasi", inputMode: "numeric" },
      { key: "tanggalValidasi", label: "Tanggal Validasi", kind: "date" },
    ],
  },
  {
    page: 3,
    title: "Lembar 3",
    subtitle: "Alamat, pendidikan, dan pekerjaan",
    fields: [
      { key: "alamat", label: "Alamat", kind: "textarea", required: true, wide: true },
      { key: "pendidikan", label: "Pendidikan" },
      { key: "pekerjaan", label: "Jenis Pekerjaan" },
    ],
  },
];

const ALL_FIELDS = SHEETS.flatMap((s) => s.fields);

const emptyForm: FormState = {
  namaLengkap: "", namaAyah: "", jenisKelamin: "", tempatLahir: "", tanggalLahir: "", kecamatan: "",
  noTelepon: "", noPorsi: "", tanggalPorsi: "", namaBank: "", noRekening: "",
  pernahHaji: "Belum", noValidasi: "", tanggalValidasi: "",
  alamat: "", pendidikan: "", pekerjaan: "",
};

type OcrState = { status: "idle" | "loading" | "done" | "error"; message?: string; missing: string[]; text: string };
const idleOcr: OcrState = { status: "idle", missing: [], text: "" };

/** "Bin"/"Binti" mengikuti jenis kelamin; awalan yang sudah ada tidak digandakan. */
function composeBinBinti(ayah: string, jk: string): string {
  const name = ayah.replace(/^\s*(binti|bin)\b\.?\s*/i, "").trim();
  if (!name || !jk) return "";
  return `${jk === "L" ? "Bin" : "Binti"} ${name}`;
}

const inputClass =
  "w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none";

function displayValue(def: FieldDef, value: string): string {
  if (!value) return "-";
  if (def.kind === "select") return def.options?.find((o) => o.value === value)?.label ?? value;
  if (def.kind === "date") {
    const [y, m, d] = value.split("-");
    return y && m && d ? `${d}/${m}/${y}` : value;
  }
  return value;
}

export default function InputDataPage() {
  const router = useRouter();

  const [step, setStep] = useState(0); // 0..2 = lembar 1..3, 3 = periksa & simpan
  const [form, setForm] = useState<FormState>(emptyForm);
  const [ocr, setOcr] = useState<Record<number, OcrState>>({ 1: idleOcr, 2: idleOcr, 3: idleOcr });
  const [previews, setPreviews] = useState<Record<number, { url: string; name: string; isPdf: boolean } | null>>({
    1: null, 2: null, 3: null,
  });
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  useEffect(() => {
    fetch(`${API_URL}/api/jemaah/kecamatan`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setKecamatanOptions(d.kecamatan ?? []))
      .catch(() => {});
    // Bebaskan URL preview saat halaman ditutup
    return () => {
      Object.values(previewsRef.current).forEach((p) => p && URL.revokeObjectURL(p.url));
    };
  }, []);

  const setField = (key: FieldKey, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const runOcr = useCallback(async (sheet: Sheet, file: File) => {
    const page = sheet.page;

    setPreviews((prev) => {
      if (prev[page]) URL.revokeObjectURL(prev[page]!.url);
      return {
        ...prev,
        [page]: { url: URL.createObjectURL(file), name: file.name, isPdf: file.type === "application/pdf" },
      };
    });
    setOcr((o) => ({ ...o, [page]: { status: "loading", missing: [], text: "" } }));

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_URL}/api/ocr/${page}`, { method: "POST", body, credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "OCR gagal.");

      const found = data.fields as Partial<Record<FieldKey, string>>;
      const pageKeys = new Set(sheet.fields.map((f) => f.key));
      setForm((f) => {
        const next = { ...f };
        for (const [key, value] of Object.entries(found)) {
          if (value && pageKeys.has(key as FieldKey)) next[key as FieldKey] = value;
        }
        return next;
      });
      setOcr((o) => ({
        ...o,
        [page]: { status: "done", missing: data.missing ?? [], text: data.text ?? "" },
      }));
    } catch (err) {
      setOcr((o) => ({
        ...o,
        [page]: { status: "error", message: err instanceof Error ? err.message : "OCR gagal.", missing: [], text: "" },
      }));
    }
  }, []);

  function onPickFile(sheet: Sheet, file: File | undefined) {
    if (file) runOcr(sheet, file);
  }

  function onDrop(sheet: Sheet, e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    onPickFile(sheet, e.dataTransfer.files?.[0]);
  }

  // ---- Validasi & simpan ----
  const binBinti = composeBinBinti(form.namaAyah, form.jenisKelamin);
  const missingRequired = ALL_FIELDS.filter((f) => f.required && !form[f.key].trim()).map((f) => f.label);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const { namaAyah: _ignored, ...rest } = form;
      const res = await fetch(`${API_URL}/api/jemaah`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, kecamatan: normalizeKecamatan(rest.kecamatan), binBinti }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Gagal menyimpan.");
      setSavedName(form.namaLengkap);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    Object.values(previews).forEach((p) => p && URL.revokeObjectURL(p.url));
    setForm(emptyForm);
    setOcr({ 1: idleOcr, 2: idleOcr, 3: idleOcr });
    setPreviews({ 1: null, 2: null, 3: null });
    setSavedName(null);
    setSaveError(null);
    setStep(0);
  }

  // ---- Tampilan ----
  const sheet = step < 3 ? SHEETS[step] : null;
  const state = sheet ? ocr[sheet.page] : idleOcr;
  const preview = sheet ? previews[sheet.page] : null;

  if (savedName) {
    return (
      <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex items-start justify-center">
        <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 text-center space-y-4 mt-space-xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h1 className="text-headline-sm font-headline-sm text-on-surface">Data berhasil disimpan</h1>
          <p className="text-body-md text-on-surface-variant">
            Data <span className="font-semibold text-on-surface">{savedName}</span> sudah masuk ke daftar jemaah.
          </p>
          <div className="flex flex-col sm:flex-row gap-space-sm justify-center pt-2">
            <button
              onClick={resetAll}
              className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary hover:bg-primary text-label-lg font-label-lg transition-colors"
            >
              Input Data Lagi
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="h-10 px-space-base rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-lg font-label-lg transition-colors"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col gap-space-lg">
      <section>
        <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface">Input Data Baru</h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
          Scan tiap lembar formulir, periksa hasil bacaan, lalu simpan. Pemrosesan OCR berjalan di komputer ini saja.
        </p>
      </section>

      {/* Langkah */}
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
        {[...SHEETS.map((s) => ({ title: s.title, sub: s.subtitle })), { title: "Periksa & Simpan", sub: "Cek semua data" }].map(
          (s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`w-full text-left rounded-xl border p-space-sm sm:p-space-base transition-colors ${
                    active
                      ? "border-primary-container bg-primary-fixed/40"
                      : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center shrink-0 ${
                        active || done ? "bg-primary-container text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {done ? <span className="material-symbols-outlined text-[16px]">check</span> : i + 1}
                    </span>
                    <span className="text-label-lg font-label-lg text-on-surface truncate">{s.title}</span>
                  </div>
                  <p className="hidden sm:block text-label-md font-label-md text-on-surface-variant mt-1 truncate">{s.sub}</p>
                </button>
              </li>
            );
          }
        )}
      </ol>

      {sheet ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg">
          {/* Upload */}
          <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base space-y-space-base self-start">
            <h2 className="text-title-md font-title-md text-on-surface">Scan {sheet.title}</h2>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => onDrop(sheet, e)}
              className={`flex flex-col items-center justify-center gap-2 text-center rounded-xl border-2 border-dashed cursor-pointer p-space-lg transition-colors ${
                dragging ? "border-primary-container bg-primary-fixed/40" : "border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[32px] text-primary">document_scanner</span>
              <span className="text-label-lg font-label-lg text-on-surface">
                {preview ? "Ganti file scan" : "Pilih file scan atau seret ke sini"}
              </span>
              <span className="text-label-md font-label-md text-on-surface-variant">JPG, PNG, atau PDF (maks. 15 MB)</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  onPickFile(sheet, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>

            {preview && (
              <div className="rounded-lg border border-outline-variant overflow-hidden bg-surface">
                {preview.isPdf ? (
                  <div className="p-space-base flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    <span className="text-body-sm truncate">{preview.name}</span>
                  </div>
                ) : (
                  <a href={preview.url} target="_blank" rel="noreferrer" title="Buka ukuran penuh">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.url} alt={`Scan ${sheet.title}`} className="w-full max-h-[420px] object-contain" />
                  </a>
                )}
              </div>
            )}

            {state.status === "loading" && (
              <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                Membaca tulisan...
              </p>
            )}
            {state.status === "error" && (
              <div role="alert" className="p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md">
                {state.message} Kamu tetap bisa mengisi kolom di samping secara manual.
              </div>
            )}
            {state.status === "done" && (
              <p className="text-body-sm text-on-surface-variant">
                {state.missing.length === 0
                  ? "Semua kolom terbaca. Tetap periksa dengan gambar di atas."
                  : `${state.missing.length} kolom tidak terbaca (ditandai merah). Isi manual dari gambar.`}
              </p>
            )}
            {state.text && (
              <details className="text-label-md font-label-md">
                <summary className="cursor-pointer text-primary font-semibold">Teks mentah hasil OCR</summary>
                <pre className="mt-2 p-2 rounded bg-surface border border-outline-variant whitespace-pre-wrap text-[12px] text-on-surface-variant max-h-60 overflow-auto">
                  {state.text}
                </pre>
              </details>
            )}
          </section>

          {/* Isian */}
          <section className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base">
            <h2 className="text-title-md font-title-md text-on-surface">{sheet.subtitle}</h2>
            <p className="text-label-md font-label-md text-on-surface-variant mb-space-base">
              Hasil bacaan bisa diubah. <span className="text-error">*</span> wajib diisi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-base">
              {sheet.fields.map((def) => {
                const value = form[def.key];
                const unread = state.status === "done" && state.missing.includes(def.key) && !value;
                const cls = `${inputClass} ${unread ? "!border-error/60 bg-error-container/20" : ""}`;
                return (
                  <div key={def.key} className={`flex flex-col gap-1 ${def.wide || def.kind === "textarea" ? "sm:col-span-2" : ""}`}>
                    <label htmlFor={`f-${def.key}`} className="text-label-sm font-label-sm uppercase tracking-wide text-on-surface-variant">
                      {def.label} {def.required && <span className="text-error">*</span>}
                      {unread && <span className="ml-2 normal-case text-error">tidak terbaca</span>}
                    </label>

                    {def.kind === "select" ? (
                      <select id={`f-${def.key}`} className={`${cls} cursor-pointer`} value={value} onChange={(e) => setField(def.key, e.target.value)}>
                        {def.key !== "pernahHaji" && <option value="">Pilih...</option>}
                        {def.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : def.kind === "combo" ? (
                      <KecamatanField
                        id={`f-${def.key}`}
                        value={value}
                        options={kecamatanOptions}
                        onChange={(v) => setField(def.key, v)}
                        className={cls}
                      />
                    ) : def.kind === "textarea" ? (
                      <textarea id={`f-${def.key}`} rows={3} className={`${cls} h-auto py-2`} value={value} onChange={(e) => setField(def.key, e.target.value)} />
                    ) : (
                      <input
                        id={`f-${def.key}`}
                        type={def.kind === "date" ? "date" : def.kind === "tel" ? "tel" : "text"}
                        inputMode={def.inputMode}
                        className={cls}
                        value={value}
                        onChange={(e) => setField(def.key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        /* Periksa & simpan */
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-space-base space-y-space-base">
          <h2 className="text-title-md font-title-md text-on-surface">Periksa semua data</h2>

          {SHEETS.map((s) => (
            <div key={s.page}>
              <h3 className="text-label-lg font-label-lg text-primary mb-2">{s.title} - {s.subtitle}</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-space-lg gap-y-3">
                {s.fields.map((def) => {
                  const empty = !form[def.key].trim();
                  return (
                    <div key={def.key} className={def.kind === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
                      <dt className="text-label-sm font-label-sm uppercase tracking-wide text-outline">{def.label}</dt>
                      <dd className={`text-body-md break-words ${empty && def.required ? "text-error font-semibold" : "text-on-surface"}`}>
                        {empty && def.required ? "Belum diisi" : displayValue(def, form[def.key])}
                      </dd>
                    </div>
                  );
                })}
                {s.page === 1 && (
                  <div>
                    <dt className="text-label-sm font-label-sm uppercase tracking-wide text-outline">Bin/Binti (akan disimpan)</dt>
                    <dd className="text-body-md text-on-surface">{binBinti || "-"}</dd>
                  </div>
                )}
              </dl>
              <button type="button" onClick={() => setStep(s.page - 1)} className="mt-2 text-label-md font-label-md text-primary font-semibold hover:underline">
                Ubah {s.title}
              </button>
            </div>
          ))}

          {missingRequired.length > 0 && (
            <div className="p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md">
              Belum bisa disimpan. Lengkapi dulu: {missingRequired.join(", ")}.
            </div>
          )}
          {saveError && (
            <div role="alert" className="p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md">
              {saveError}
            </div>
          )}
        </section>
      )}

      {/* Navigasi */}
      <div className="flex items-center justify-between gap-space-sm pb-space-lg">
        <div>
          {step === 0 ? (
            <Link href="/dashboard" className="h-10 px-space-base rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-lg font-label-lg transition-colors inline-flex items-center">
              Batal
            </Link>
          ) : (
            <button type="button" onClick={() => setStep(step - 1)} className="h-10 px-space-base rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-lg font-label-lg transition-colors">
              Kembali
            </button>
          )}
        </div>
        {step < 3 ? (
          <button type="button" onClick={() => setStep(step + 1)} className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary hover:bg-primary text-label-lg font-label-lg transition-colors flex items-center gap-1">
            {step === 2 ? "Periksa" : "Lanjut"}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || missingRequired.length > 0}
            className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary hover:bg-primary text-label-lg font-label-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan Data"}
          </button>
        )}
      </div>
    </main>
  );
}