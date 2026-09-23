import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Redis } from "ioredis";

export function registerHealthRoutes(
  app: FastifyInstance,
  deps: { prisma?: PrismaClient; redis?: Redis },
): void {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/ready", async (_request, reply) => {
    const checks: Record<string, "ok" | "skipped" | "error"> = {
      postgres: "skipped",
      redis: "skipped",
    };

    try {
      if (deps.prisma) {
        await deps.prisma.$queryRaw`SELECT 1`;
        checks.postgres = "ok";
      }
    } catch {
      checks.postgres = "error";
    }

    try {
      if (deps.redis) {
        const pong = await deps.redis.ping();
        checks.redis = pong === "PONG" ? "ok" : "error";
      }
    } catch {
      checks.redis = "error";
    }

    const ready = checks.postgres !== "error" && checks.redis !== "error";
    if (!ready) {
      return reply.code(503).send({ status: "not_ready", checks });
    }
    return { status: "ready", checks };
  });
}
