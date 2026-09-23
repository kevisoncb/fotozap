import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { Shield, UserCog } from "lucide-react";
import { CreateAdminForm } from "./CreateAdminForm";
import { AdminActions } from "./AdminActions";
import { requireAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

function getRoleBadge(role: string) {
  if (role === "ADMIN") {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
        <Shield size={12} />
        ADMIN
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1">
      <UserCog size={12} />
      VIEWER
    </span>
  );
}

function getStatusBadge(status: string) {
  if (status === "ACTIVE") {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        Ativo
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
      Suspenso
    </span>
  );
}

async function getAdmins() {
  return prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function AdminsPage() {
  try {
    // Requer permissão de ADMIN
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const admins = await getAdmins();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Admins</h1>
        <CreateAdminForm />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Nome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  Último Login
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-4 px-4 font-medium">{admin.email}</td>
                  <td className="py-4 px-4 text-sm text-gray-400">{admin.name || "-"}</td>
                  <td className="py-4 px-4">{getRoleBadge(admin.role)}</td>
                  <td className="py-4 px-4">{getStatusBadge(admin.status)}</td>
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Nunca"}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <AdminActions admin={admin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {admins.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum admin cadastrado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
