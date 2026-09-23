import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { ProductToggle } from "./ProductToggle";
import { EditProductForm } from "./EditProductForm";

async function getProducts() {
  return prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Nome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Slug</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Preço</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-4 px-4 font-medium">{product.name}</td>
                  <td className="py-4 px-4 text-sm text-gray-400">{product.slug}</td>
                  <td className="py-4 px-4 text-right">
                    R$ {(product.priceCents / 100).toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    <ProductToggle productId={product.id} initialActive={product.active} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <EditProductForm product={product} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum produto cadastrado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
