"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Operator = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: "ADMIN" | "OPERATOR";
  is_active: boolean;
  created_at: string;
};

type FormState = {
  username: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATOR";
  password: string;
};

const emptyForm: FormState = { username: "", name: "", email: "", role: "OPERATOR", password: "" };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Terjadi kesalahan.");
  return data as T;
}

const inputClass =
  "w-full h-10 px-3 bg-surface rounded-lg border border-outline-variant text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none";

export default function UserManagementPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [meUsername, setMeUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; id: string }>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, me] = await Promise.all([
        api<{ operators: Operator[] }>("/api/operators"),
        api<{ user: { username: string } }>("/api/auth/me"),
      ]);
      setOperators(list.operators);
      setMeUsername(me.user.username);
      setPageError(null);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setModal({ mode: "create" });
  }

  function openEdit(op: Operator) {
    setForm({
      username: op.username,
      name: op.name,
      email: op.email ?? "",
      role: op.role,
      password: "",
    });
    setFormError(null);
    setModal({ mode: "edit", id: op.id });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setFormError(null);

    try {
      if (modal.mode === "create") {
        await api("/api/operators", {
          method: "POST",
          body: JSON.stringify(form),
        });
      } else {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password) body.password = form.password;
        await api(`/api/operators/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      setModal(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(op: Operator) {
    const action = op.is_active ? "menonaktifkan" : "mengaktifkan kembali";
    if (!window.confirm(`Yakin ingin ${action} akun "${op.username}"?`)) return;
    try {
      await api(`/api/operators/${op.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !op.is_active }),
      });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal mengubah status akun.");
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col gap-space-lg">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-base">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Manajemen Pengguna</h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Kelola akun staf dan operator yang bisa masuk ke sistem.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-primary transition-colors duration-150 shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>Tambah Akun</span>
        </button>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {pageError && (
          <div className="m-space-base p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md">
            {pageError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-body-sm whitespace-nowrap">
            <thead>
              <tr className="h-10 bg-surface border-b border-outline-variant text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="px-3.5 py-2 font-semibold">Nama</th>
                <th className="px-3.5 py-2 font-semibold">Username</th>
                <th className="px-3.5 py-2 font-semibold">Email</th>
                <th className="px-3.5 py-2 font-semibold">Role</th>
                <th className="px-3.5 py-2 font-semibold">Status</th>
                <th className="px-3.5 py-2 font-semibold">Dibuat</th>
                <th className="px-3.5 py-2 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3.5 py-8 text-center text-on-surface-variant">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && operators.length === 0 && !pageError && (
                <tr>
                  <td colSpan={7} className="px-3.5 py-8 text-center text-on-surface-variant">
                    Belum ada akun.
                  </td>
                </tr>
              )}
              {operators.map((op) => {
                const isMe = op.username === meUsername;
                return (
                  <tr key={op.id} className="h-12 hover:bg-surface-container-low transition-colors duration-100">
                    <td className="px-3.5 py-2 font-semibold text-on-surface">
                      {op.name}
                      {isMe && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-primary">(Kamu)</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-on-surface-variant">{op.username}</td>
                    <td className="px-3.5 py-2 text-on-surface-variant">{op.email ?? "-"}</td>
                    <td className="px-3.5 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          op.role === "ADMIN"
                            ? "bg-secondary-container text-on-secondary-container border-secondary-fixed"
                            : "bg-surface-container-highest text-primary border-outline-variant"
                        }`}
                      >
                        {op.role === "ADMIN" ? "Admin" : "Operator"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          op.is_active
                            ? "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim"
                            : "bg-error-container text-on-error-container border-error/30"
                        }`}
                      >
                        {op.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-on-surface-variant">
                      {new Date(op.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-3.5 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(op)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Edit / reset password"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => toggleActive(op)}
                          disabled={isMe}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={op.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {op.is_active ? "block" : "check_circle"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-gutter-sm"
          onClick={() => !saving && setModal(null)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg p-5 sm:p-6 space-y-4"
          >
            <h2 className="text-headline-sm font-headline-sm text-on-surface">
              {modal.mode === "create" ? "Tambah Akun Baru" : "Edit Akun"}
            </h2>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded bg-error-container/60 border border-error/30 text-on-error-container text-label-md font-label-md"
              >
                {formError}
              </div>
            )}

            <div>
              <label className="block text-label-md font-label-md font-semibold text-on-surface mb-1.5">
                Username
              </label>
              <input
                className={`${inputClass} ${modal.mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={modal.mode === "edit"}
                required
                placeholder="mis. budi.santoso"
              />
            </div>

            <div>
              <label className="block text-label-md font-label-md font-semibold text-on-surface mb-1.5">
                Nama Lengkap
              </label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-label-md font-label-md font-semibold text-on-surface mb-1.5">
                Email (opsional)
              </label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-label-md font-label-md font-semibold text-on-surface mb-1.5">
                Role
              </label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as FormState["role"] })}
              >
                <option value="OPERATOR">Operator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-label-md font-label-md font-semibold text-on-surface mb-1.5">
                {modal.mode === "create" ? "Password" : "Password Baru (kosongkan jika tidak diganti)"}
              </label>
              <input
                type="password"
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={modal.mode === "create"}
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div className="flex justify-end gap-space-sm pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={saving}
                className="h-10 px-space-base rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-lg font-label-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-space-base rounded-lg bg-primary-container text-on-primary hover:bg-primary text-label-lg font-label-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}