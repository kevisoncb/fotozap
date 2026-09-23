import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not set - Prisma operations will fail");
    console.warn("   Pages will load but data fetching will return errors");
    // Return a client that will fail on actual database operations
    // but won't crash during import
    return new PrismaClient({
      log: ["error"],
    }) as any;
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
