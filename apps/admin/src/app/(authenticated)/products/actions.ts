"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth-helpers";
import type { AuditAction } from "../../../../../../generated/prisma/client";

export async function toggleProductActive(productId: string, active: boolean) {
  // Requer permissão de ADMIN
  const admin = await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { active },
  });

  // Registra audit log
  try {
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "PRODUCT_TOGGLED" as AuditAction,
        resource: "product",
        resourceId: productId,
        details: {
          productName: product.name,
          productSlug: product.slug,
          active,
        },
      },
    });
  } catch {
    // Não falha a operação se o audit log falhar
  }

  revalidatePath("/products");
}

export async function updateProduct(data: {
  id: string;
  priceCents: number;
  prompt: string;
}) {
  // Requer permissão de ADMIN
  const admin = await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: data.id },
    select: { id: true, name: true, slug: true, priceCents: true, prompt: true },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  await prisma.product.update({
    where: { id: data.id },
    data: {
      priceCents: data.priceCents,
      prompt: data.prompt,
    },
  });

  // Registra audit log
  try {
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "PRODUCT_UPDATED" as AuditAction,
        resource: "product",
        resourceId: data.id,
        details: {
          productName: product.name,
          productSlug: product.slug,
          changes: {
            priceCents: {
              from: product.priceCents,
              to: data.priceCents,
            },
            prompt: {
              from: product.prompt.substring(0, 50) + "...",
              to: data.prompt.substring(0, 50) + "...",
            },
          },
        },
      },
    });
  } catch {
    // Não falha a operação se o audit log falhar
  }

  revalidatePath("/products");
}
