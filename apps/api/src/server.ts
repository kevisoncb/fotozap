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
import { WhatsAppImageHandler } from "./modules/whatsapp/image.handler.js";
import { UserService } from "./modules/users/user.service.js";
import { ProductService } from "./modules/products/product.service.js";
import { MessageService } from "./modules/messages/message.service.js";
import { OrderService } from "./modules/orders/order.service.js";
import { PaymentService } from "./modules/payments/payment.service.js";
import { WebhookService } from "./modules/webhooks/webhook.service.js";
import { ImageService } from "./modules/images/image.service.js";
import { PaymentFlowService } from "./modules/payment/payment-flow.service.js";
import { MercadoPagoWebhookHandler } from "./modules/mercadopago/webhook.handler.js";
import { registerMercadoPagoRoutes } from "./modules/mercadopago/routes.js";
import { createStorageProvider } from "./providers/storage/factory.js";
import { createPaymentProvider } from "./providers/payment/factory.js";

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

  // WhatsApp & Payment routes
  if (prisma && redis) {
    const whatsappProvider = createWhatsAppProvider(env.WHATSAPP_PROVIDER, {
      accessToken: env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
      verifyToken: env.WHATSAPP_VERIFY_TOKEN,
      appSecret: env.WHATSAPP_APP_SECRET,
    });

    const storageProvider = createStorageProvider(env.STORAGE_PROVIDER, {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
      publicUrl: env.R2_PUBLIC_URL,
    });

    const paymentProvider = createPaymentProvider(env.PAYMENT_PROVIDER, {
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    });

    const conversationService = new ConversationService(redis, env.CONVERSATION_TTL_SECONDS);
    const userService = new UserService(prisma);
    const productService = new ProductService(prisma);
    const messageService = new MessageService(prisma);
    const orderService = new OrderService(prisma);
    const paymentService = new PaymentService(prisma);
    const webhookService = new WebhookService(prisma);
    const imageService = new ImageService(storageProvider);

    const paymentFlowService = new PaymentFlowService(
      prisma,
      paymentProvider,
      paymentService,
      orderService,
      env.PAYMENT_EXPIRATION_MINUTES,
    );

    const botService = new BotService(
      whatsappProvider,
      conversationService,
      userService,
      productService,
      orderService,
    );

    const imageHandler = new WhatsAppImageHandler(
      whatsappProvider,
      imageService,
      orderService,
      conversationService,
      paymentFlowService,
      env.MAX_IMAGE_SIZE_MB,
    );

    const whatsappWebhookHandler = new WhatsAppWebhookHandler(
      whatsappProvider,
      botService,
      messageService,
      userService,
      imageHandler,
    );

    const mercadoPagoWebhookHandler = new MercadoPagoWebhookHandler(
      paymentProvider,
      paymentFlowService,
      webhookService,
      env.MERCADOPAGO_WEBHOOK_SECRET ?? "mock_secret",
    );

    registerWhatsAppRoutes(app, whatsappWebhookHandler);
    registerMercadoPagoRoutes(app, mercadoPagoWebhookHandler);

    app.log.info(
      {
        whatsapp: env.WHATSAPP_PROVIDER,
        payment: env.PAYMENT_PROVIDER,
        storage: env.STORAGE_PROVIDER,
        maxImageMB: env.MAX_IMAGE_SIZE_MB,
      },
      "WhatsApp & Payment routes registered",
    );
  } else {
    app.log.warn(
      "WhatsApp & Payment routes not registered (DATABASE_URL or REDIS_URL missing). Set them to enable bot.",
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
