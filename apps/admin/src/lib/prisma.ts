import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please start PostgreSQL and configure .env:\n" +
      "DATABASE_URL=postgresql://fotozap:fotozap@localhost:5432/fotozap?schema=public"
    );
  }

  // Create adapter for Prisma 7.x
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
