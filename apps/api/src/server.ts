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
import { createImageProvider } from "./providers/image/factory.js";
import { GenerationService } from "./modules/generations/generation.service.js";
import { createGenerationQueue } from "./queues/generation.queue.js";
import { createCleanupQueue } from "./queues/cleanup.queue.js";
import { createExpirationQueue } from "./queues/expiration.queue.js";
import { createGenerationWorker } from "./workers/generation.worker.js";
import { createCleanupWorker } from "./workers/cleanup.worker.js";
import { createExpirationWorker } from "./workers/expiration.worker.js";
import { scheduleCleanupJobs } from "./schedulers/cleanup.scheduler.js";
import { scheduleExpirationJobs } from "./schedulers/expiration.scheduler.js";

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

  // WhatsApp, Payment, and Workers
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

    const imageProvider = createImageProvider(env.IMAGE_PROVIDER, {
      apiKey: env.OPENAI_API_KEY,
    });

    // Queues
    const generationQueue = createGenerationQueue(redis);
    const cleanupQueue = createCleanupQueue(redis);
    const expirationQueue = createExpirationQueue(redis);

    // Services
    const conversationService = new ConversationService(redis, env.CONVERSATION_TTL_SECONDS);
    const userService = new UserService(prisma);
    const productService = new ProductService(prisma);
    const messageService = new MessageService(prisma);
    const orderService = new OrderService(prisma);
    const paymentService = new PaymentService(prisma);
    const webhookService = new WebhookService(prisma);
    const imageService = new ImageService(storageProvider);
    const generationService = new GenerationService(prisma);

    const paymentFlowService = new PaymentFlowService(
      prisma,
      paymentProvider,
      paymentService,
      orderService,
      env.PAYMENT_EXPIRATION_MINUTES,
      generationQueue,
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

    // Workers
    const generationWorker = createGenerationWorker({
      redis,
      prisma,
      imageProvider,
      storage: storageProvider,
      whatsapp: whatsappProvider,
      generationService,
      orderService,
      concurrency: env.IMAGE_WORKER_CONCURRENCY,
    });

    const cleanupWorker = createCleanupWorker({
      redis,
      prisma,
      storage: storageProvider,
      inputRetentionHours: env.INPUT_RETENTION_HOURS,
      outputRetentionDays: env.OUTPUT_RETENTION_DAYS,
    });

    const expirationWorker = createExpirationWorker({
      redis,
      prisma,
    });

    // Start workers
    await generationWorker.run();
    await cleanupWorker.run();
    await expirationWorker.run();

    // Schedulers
    const cleanupTimer = scheduleCleanupJobs(cleanupQueue, env.CLEANUP_INTERVAL_HOURS);
    const expirationTimer = scheduleExpirationJobs(
      expirationQueue,
      env.EXPIRATION_CHECK_INTERVAL_MINUTES,
    );

    // Routes
    registerWhatsAppRoutes(app, whatsappWebhookHandler);
    registerMercadoPagoRoutes(app, mercadoPagoWebhookHandler);

    app.log.info(
      {
        whatsapp: env.WHATSAPP_PROVIDER,
        payment: env.PAYMENT_PROVIDER,
        storage: env.STORAGE_PROVIDER,
        image: env.IMAGE_PROVIDER,
        workers: {
          generation: env.IMAGE_WORKER_CONCURRENCY,
          cleanup: `every ${env.CLEANUP_INTERVAL_HOURS}h`,
          expiration: `every ${env.EXPIRATION_CHECK_INTERVAL_MINUTES}min`,
        },
      },
      "System fully initialized",
    );

    // Graceful shutdown
    app.addHook("onClose", async () => {
      clearInterval(cleanupTimer);
      clearInterval(expirationTimer);
      await generationWorker.close();
      await cleanupWorker.close();
      await expirationWorker.close();
      await generationQueue.close();
      await cleanupQueue.close();
      await expirationQueue.close();
      app.log.info("Workers and queues closed");
    });
  } else {
    app.log.warn(
      "System not fully initialized (DATABASE_URL or REDIS_URL missing). Set them to enable full functionality.",
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
