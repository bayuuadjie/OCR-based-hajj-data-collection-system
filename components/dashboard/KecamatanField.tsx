"use client";

import { useEffect, useRef, useState } from "react";

const MANUAL = "__manual__";

export function normalizeKecamatan(value: string): string {
  const name = value
    .replace(/^\s*(kecamatan|kec)\b\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return "";
  return `Kec. ${name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}`;
}

export default function KecamatanField({
  id,
  value,
  options,
  onChange,
  className,
}: {
  id: string;
  value: string;
  options: string[]; // kecamatan yang sudah ada di data
  onChange: (value: string) => void;
  className: string; // kelas gaya input yang sama dengan kolom lain
}) {
  const [manual, setManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusNext = useRef(false);

  const inList = options.includes(value);
  // Mode isi manual: dipilih operator, belum ada daftar, atau hasil OCR tidak ada di daftar
  const manualMode = manual || options.length === 0 || (value !== "" && !inList);

  // Pindahkan kursor ke kotak ketik hanya saat operator memilih "isi manual"
  useEffect(() => {
    if (focusNext.current && manualMode) {
      inputRef.current?.focus();
      focusNext.current = false;
    }
  }, [manualMode]);

  function handleSelect(next: string) {
    if (next === MANUAL) {
      focusNext.current = true;
      setManual(true);
      if (inList) onChange(""); // kosongkan pilihan lama supaya tidak tertukar
    } else {
      setManual(false);
      onChange(next);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {options.length > 0 && (
        <select
          id={id}
          className={`${className} cursor-pointer`}
          value={manualMode ? MANUAL : value}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">Pilih kecamatan...</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={MANUAL}>Lainnya (isi manual)...</option>
        </select>
      )}

      {manualMode && (
        <input
          id={options.length === 0 ? id : `${id}-manual`}
          ref={inputRef}
          className={className}
          value={value}
          placeholder="Ketik nama kecamatan"
          aria-label="Nama kecamatan (isi manual)"
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => value && onChange(normalizeKecamatan(value))}
        />
      )}
    </div>
  );
}