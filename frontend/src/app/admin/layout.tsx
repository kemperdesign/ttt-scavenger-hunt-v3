import { AdminLayout } from "@/components/admin/AdminLayout";
import { AuthGuard } from "@/components/admin/AuthGuard";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
