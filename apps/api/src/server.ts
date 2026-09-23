import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./config/env.js";
import { createPrismaClient } from "./shared/prisma.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { registerWhatsAppRoutes } from "./modules/whatsapp/routes.js";
import { createWhatsAppProvider } from "./providers/whatsapp/factory.js";
import { ConversationService } from "./modules/conversations/conversation.service.js";
import { BotService } from "./modules/whatsapp/bot.service.js";
import { WhatsAppWebhookHandler } from "./modules/whatsapp/webhook.handler.js";
import { UserService } from "./modules/users/user.service.js";
import { ProductService } from "./modules/products/product.service.js";
import { MessageService } from "./modules/messages/message.service.js";

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

  // WhatsApp routes
  if (prisma && redis) {
    const whatsappProvider = createWhatsAppProvider(env.WHATSAPP_PROVIDER, {
      accessToken: env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
      verifyToken: env.WHATSAPP_VERIFY_TOKEN,
      appSecret: env.WHATSAPP_APP_SECRET,
    });

    const conversationService = new ConversationService(redis, env.CONVERSATION_TTL_SECONDS);
    const userService = new UserService(prisma);
    const productService = new ProductService(prisma);
    const messageService = new MessageService(prisma);

    const botService = new BotService(
      whatsappProvider,
      conversationService,
      userService,
      productService,
    );

    const webhookHandler = new WhatsAppWebhookHandler(
      whatsappProvider,
      botService,
      messageService,
      userService,
    );

    registerWhatsAppRoutes(app, webhookHandler);

    app.log.info("WhatsApp routes registered");
  } else {
    app.log.warn(
      "WhatsApp routes not registered (DATABASE_URL or REDIS_URL missing). Set them to enable bot.",
    );
  }

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
