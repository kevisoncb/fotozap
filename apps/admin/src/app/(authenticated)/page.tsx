import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";

async function getMetrics() {
  const [totalRevenue, paidOrders, failedGenerations, totalOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amountCents: true },
    }),
    prisma.order.count({
      where: { status: { in: ["PAID", "PROCESSING", "COMPLETED"] } },
    }),
    prisma.generation.count({
      where: { status: "FAILED" },
    }),
    prisma.order.count(),
  ]);

  return {
    totalRevenue: (totalRevenue._sum.amountCents || 0) / 100,
    paidOrders,
    failedGenerations,
    totalOrders,
  };
}

export default async function DashboardPage() {
  const metrics = await getMetrics();

  const stats = [
    {
      label: "Faturamento Total",
      value: `R$ ${metrics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Pedidos Pagos",
      value: `${metrics.paidOrders} / ${metrics.totalOrders}`,
      icon: CheckCircle,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Falhas de Geração",
      value: metrics.failedGenerations.toString(),
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
