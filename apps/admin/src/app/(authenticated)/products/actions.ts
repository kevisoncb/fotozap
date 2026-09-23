"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleProductActive(productId: string, active: boolean) {
  await prisma.product.update({
    where: { id: productId },
    data: { active },
  });

  revalidatePath("/products");
}

export async function updateProduct(data: {
  id: string;
  priceCents: number;
  prompt: string;
}) {
  await prisma.product.update({
    where: { id: data.id },
    data: {
      priceCents: data.priceCents,
      prompt: data.prompt,
    },
  });

  revalidatePath("/products");
}
