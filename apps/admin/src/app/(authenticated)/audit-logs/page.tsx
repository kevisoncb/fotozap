import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { Shield, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

function getActionBadge(action: string) {
  const colors: Record<string, string> = {
    ADMIN_LOGIN: "bg-green-500/20 text-green-400",
    ADMIN_LOGOUT: "bg-gray-500/20 text-gray-400",
    ADMIN_CREATED: "bg-blue-500/20 text-blue-400",
    ADMIN_UPDATED: "bg-yellow-500/20 text-yellow-400",
    ADMIN_SUSPENDED: "bg-red-500/20 text-red-400",
    PRODUCT_UPDATED: "bg-purple-500/20 text-purple-400",
    PRODUCT_TOGGLED: "bg-indigo-500/20 text-indigo-400",
    ORDER_VIEWED: "bg-cyan-500/20 text-cyan-400",
    GENERATION_VIEWED: "bg-pink-500/20 text-pink-400",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action] || "bg-gray-500/20 text-gray-400"}`}>
      {action}
    </span>
  );
}

async function getAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export default async function AuditLogsPage() {
  try {
    // Requer permissão de ADMIN
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const logs = await getAuditLogs();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <FileText className="text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-400 text-sm">Histórico de ações administrativas</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Data/Hora</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Admin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Ação</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Recurso</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {new Date(log.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {log.admin.role === "ADMIN" && (
                        <Shield size={14} className="text-purple-400" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{log.admin.email}</div>
                        {log.admin.name && (
                          <div className="text-xs text-gray-500">{log.admin.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getActionBadge(log.action)}</td>
                  <td className="py-4 px-4">
                    {log.resource && log.resourceId ? (
                      <div className="text-sm">
                        <div className="text-gray-400">{log.resource}</div>
                        <div className="font-mono text-xs text-gray-600">
                          {log.resourceId.slice(0, 8)}...
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500 font-mono">
                    {log.ipAddress || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum log de auditoria encontrado</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 text-sm text-gray-500">
        Exibindo os {logs.length} registros mais recentes
      </div>
    </div>
  );
}
