import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import Redis from "ioredis";
import { loadEnv } from "./config/env.js";
import { createPrismaClient } from "./shared/prisma.js";
import { registerHealthRoutes } from "./modules/health/routes.js";

async function main() {
  const env = loadEnv();
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: [
        "req.headers.authorization",
        "WHATSAPP_ACCESS_TOKEN",
        "MERCADOPAGO_ACCESS_TOKEN",
        "IMAGE_PROVIDER_API_KEY",
        "R2_SECRET_ACCESS_KEY",
      ],
    },
  });

  await app.register(cors, { origin: false });

  const prisma = env.DATABASE_URL ? createPrismaClient(env.DATABASE_URL) : undefined;
  const redis = env.REDIS_URL
    ? new (await import("ioredis")).default(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      })
    : undefined;

  registerHealthRoutes(app, { prisma, redis });

  app.addHook("onClose", async () => {
    await prisma?.$disconnect();
    redis?.disconnect();
  });

  await app.listen({ host: env.API_HOST, port: env.API_PORT });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
