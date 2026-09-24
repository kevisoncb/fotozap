import type { PrismaClient, Product } from "@prisma/client";

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  async listActive(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { slug },
    });
  }

  async findById(productId: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id: productId },
    });
  }

  async isActive(productId: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { active: true },
    });
    return product?.active ?? false;
  }
}
