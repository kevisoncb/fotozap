/**
 * E2E Test Setup
 *
 * Configura ambiente de teste end-to-end com:
 * - Prisma Test Database
 * - Redis Mock
 * - Mock Providers (WhatsApp, Payment, Image, Storage)
 */

import { PrismaClient } from "../../../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { beforeAll, afterAll, beforeEach } from "vitest";
import pg from "pg";

// Configure test database
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

export const prisma = TEST_DB_URL
  ? (() => {
      const pool = new pg.Pool({ connectionString: TEST_DB_URL });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    })()
  : new PrismaClient();

/**
 * Setup global test hooks
 */
export function setupE2EEnvironment() {
  beforeAll(async () => {
    // Garante que o schema está criado
    // Em ambiente de teste real, usar migrations ou push
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpa todas as tabelas antes de cada teste
    await cleanDatabase();
  });
}

/**
 * Limpa todas as tabelas do banco de dados
 */
export async function cleanDatabase() {
  // Ordem importa devido às foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.generation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.message.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.conversationAudit.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
}

/**
 * Seed básico para testes
 */
export async function seedTestData() {
  // Cria produtos de teste
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Foto Estilo Retro",
        slug: "retro",
        description: "Transforme sua foto em estilo retrô vintage",
        priceCents: 500,
        currency: "BRL",
        prompt: "vintage retro style photo, warm tones, film grain",
        active: true,
        sortOrder: 1,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    }),
    prisma.product.create({
      data: {
        name: "Foto Estilo Futurista",
        slug: "futurista",
        description: "Transforme sua foto em arte futurista",
        priceCents: 600,
        currency: "BRL",
        prompt: "futuristic cyberpunk style, neon lights, high tech",
        active: true,
        sortOrder: 2,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    }),
  ]);

  // Cria admin de teste
  const admin = await prisma.adminUser.create({
    data: {
      email: "admin@test.com",
      // Hash de "password123" com bcrypt
      passwordHash:
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY0JJW/lO8p5NW6",
      name: "Test Admin",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  return {
    products,
    admin,
  };
}
