import ComingSoon from "@/components/dashboard/ComingSoon";

export default function UserManagementPage() {
  return (
    <ComingSoon
      title="Manajemen Pengguna"
      description="Daftar akun operator, tambah akun baru, reset password, dan nonaktifkan akun akan ada di sini. Untuk sekarang, kelola akun lewat scripts/create-user.ts atau scripts/seed.ts."
    />
  );
}