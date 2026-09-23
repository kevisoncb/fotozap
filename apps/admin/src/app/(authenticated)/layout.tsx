import { Sidebar } from "@/components/Sidebar";
import { getCurrentAdmin } from "@/lib/auth-helpers";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  const isAdmin = admin?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
