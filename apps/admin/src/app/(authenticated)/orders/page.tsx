import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";

function maskPhone(phone: string) {
  if (phone.length <= 4) return phone;
  const lastFour = phone.slice(-4);
  const masked = "*".repeat(phone.length - 4);
  return masked + lastFour;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    CREATED: "bg-gray-700 text-gray-300",
    PENDING_PAYMENT: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-green-500/20 text-green-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    GENERATION_COMPLETED: "bg-blue-500/20 text-blue-300",
    DELIVERY_PENDING: "bg-purple-500/20 text-purple-400",
    COMPLETED: "bg-green-500/20 text-green-300",
    FAILED: "bg-red-500/20 text-red-400",
    CANCELLED: "bg-gray-700 text-gray-400",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-700 text-gray-300"}`}
    >
      {status}
    </span>
  );
}

async function getOrders() {
  return prisma.order.findMany({
    include: {
      user: true,
      product: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      generations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Pedidos & Gerações</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  ID Pedido
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Produto</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  Status Pedido
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  Status Pix
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  Status IA
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Valor</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-4 px-4 font-mono text-xs text-gray-400">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {order.user.whatsappPhone
                      ? maskPhone(order.user.whatsappPhone)
                      : "N/A"}
                  </td>
                  <td className="py-4 px-4 text-sm">{order.product.name}</td>
                  <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-4 px-4">
                    {order.payments[0]
                      ? getStatusBadge(order.payments[0].status)
                      : <span className="text-gray-500 text-xs">-</span>}
                  </td>
                  <td className="py-4 px-4">
                    {order.generations[0]
                      ? getStatusBadge(order.generations[0].status)
                      : <span className="text-gray-500 text-xs">-</span>}
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    R$ {(order.amountCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
