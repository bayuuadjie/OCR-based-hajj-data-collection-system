"use client";

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { matchOption } from "@/lib/normalize";

type Row = { kind: "option"; text: string } | { kind: "new"; text: string };

export default function ComboField({
  id,
  value,
  options,
  onChange,
  className,
  placeholder,
  normalize,
}: {
  id: string;
  value: string;
  options: string[]; // dari database, yang paling sering dipakai di atas
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
  normalize?: (value: string) => string; // merapikan nilai baru, mis. jadi "Kec. Cibiru"
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);

  const query = value.trim().toLowerCase();

  const rows: Row[] = useMemo(() => {
    const matched = query ? options.filter((o) => o.toLowerCase().includes(query)) : options;
    // Yang diawali ketikan ditaruh di atas yang hanya memuatnya
    const sorted = query
      ? [...matched.filter((o) => o.toLowerCase().startsWith(query)), ...matched.filter((o) => !o.toLowerCase().startsWith(query))]
      : matched;
    const list: Row[] = sorted.map((text) => ({ kind: "option", text }));
    if (query && !matchOption(value, options)) list.push({ kind: "new", text: value.trim() });
    return list;
  }, [options, query, value]);

  const tidy = (v: string) => matchOption(v, options) ?? (normalize ? normalize(v) : v.replace(/\s+/g, " ").trim());

  // Nilai dari luar (mis. hasil OCR) disamakan dengan pilihan yang ada, selama tidak sedang diketik
  useEffect(() => {
    if (focused || !value.trim()) return;
    const tidied = tidy(value);
    if (tidied !== value) onChange(tidied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options, focused]);

  function select(row: Row) {
    onChange(row.kind === "option" ? row.text : tidy(row.text));
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && active >= 0 && rows[active]) {
      e.preventDefault(); // jangan mengirim form
      select(rows[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  const showList = open && options.length > 0 && rows.length > 0;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        className={`${className} ${options.length > 0 ? "pr-9" : ""}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          setOpen(false);
          setActive(-1);
          if (value.trim()) {
            const tidied = tidy(value);
            if (tidied !== value) onChange(tidied);
          }
        }}
        onKeyDown={onKeyDown}
      />

      {options.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Tampilkan pilihan"
          onMouseDown={(e) => {
            e.preventDefault(); // jaga fokus tetap di kolom
            const willOpen = !showList; // hitung dulu: memberi fokus ikut membuka daftar
            inputRef.current?.focus();
            setOpen(willOpen);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-outline hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">expand_more</span>
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg py-1 text-body-sm"
        >
          {rows.map((row, i) => (
            <li
              key={`${row.kind}-${row.text}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault(); // pilih sebelum kolom kehilangan fokus
                select(row);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 cursor-pointer ${
                row.kind === "new" ? "text-primary font-semibold border-t border-outline-variant" : "text-on-surface"
              } ${i === active ? "bg-primary-fixed/40" : "hover:bg-surface-container"}`}
            >
              {row.kind === "new" ? `Gunakan "${row.text}" (pilihan baru)` : row.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}