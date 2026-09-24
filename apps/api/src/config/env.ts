import { z } from "zod";
import { hasUsableSecrets } from "./secrets.js";

const boolish = z
  .string()
  .optional()
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  CONVERSATION_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().default(10),
  MAX_MESSAGES_PER_MINUTE: z.coerce.number().int().positive().default(20),
  MAX_UPLOADS_PER_HOUR: z.coerce.number().int().positive().default(15),
  MAX_GENERATIONS_PER_HOUR: z.coerce.number().int().positive().default(10),
  MAX_ORDERS_PER_HOUR: z.coerce.number().int().positive().default(10),
  IMAGE_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  PAYMENT_EXPIRATION_MINUTES: z.coerce.number().int().positive().default(30),
  INPUT_RETENTION_HOURS: z.coerce.number().positive().default(24),
  OUTPUT_RETENTION_DAYS: z.coerce.number().positive().default(7),
  CLEANUP_INTERVAL_HOURS: z.coerce.number().positive().default(6),
  EXPIRATION_CHECK_INTERVAL_MINUTES: z.coerce.number().int().positive().default(5),
  DISPLAY_TIMEZONE: z.string().default("America/Sao_Paulo"),
  CURRENCY: z.string().default("BRL"),
  WHATSAPP_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  PAYMENT_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  IMAGE_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  STORAGE_PROVIDER: z.enum(["mock", "r2"]).default("mock"),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  ADMIN_SESSION_SECRET: z.string().min(16).optional(),
  JWT_SECRET: z.string().optional(),
  ADMIN_PASSWORD: z.string().min(6).optional(),
  STRICT_ENV: boolish,
});

type ParsedEnv = z.infer<typeof schema>;

export type AppEnv = Omit<ParsedEnv, "API_PORT" | "PORT"> & {
  API_PORT: number;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = schema.parse(source);
  const production = parsed.NODE_ENV === "production";

  if (production) {
    const missing: string[] = [];
    if (!parsed.DATABASE_URL) missing.push("DATABASE_URL");
    if (!parsed.REDIS_URL) missing.push("REDIS_URL");
    if (missing.length > 0) {
      throw new Error(`Missing required production env: ${missing.join(", ")}`);
    }
  }

  const whatsappProvider =
    parsed.WHATSAPP_PROVIDER === "real" &&
    hasUsableSecrets(
      parsed.WHATSAPP_ACCESS_TOKEN,
      parsed.WHATSAPP_PHONE_NUMBER_ID,
      parsed.WHATSAPP_VERIFY_TOKEN,
      parsed.WHATSAPP_APP_SECRET,
    )
      ? "real"
      : "mock";

  const paymentProvider =
    parsed.PAYMENT_PROVIDER === "real" && hasUsableSecrets(parsed.MERCADOPAGO_ACCESS_TOKEN)
      ? "real"
      : "mock";

  const imageProvider =
    parsed.IMAGE_PROVIDER === "openai" && hasUsableSecrets(parsed.OPENAI_API_KEY)
      ? "openai"
      : "mock";

  const storageProvider =
    parsed.STORAGE_PROVIDER === "r2" &&
    hasUsableSecrets(
      parsed.R2_ACCOUNT_ID,
      parsed.R2_ACCESS_KEY_ID,
      parsed.R2_SECRET_ACCESS_KEY,
      parsed.R2_BUCKET,
      parsed.R2_PUBLIC_URL,
    )
      ? "r2"
      : "mock";

  const adminSessionSecret =
    parsed.ADMIN_SESSION_SECRET && parsed.ADMIN_SESSION_SECRET.length >= 16
      ? parsed.ADMIN_SESSION_SECRET
      : parsed.JWT_SECRET && parsed.JWT_SECRET.length >= 16
        ? parsed.JWT_SECRET
        : parsed.ADMIN_SESSION_SECRET;

  return {
    ...parsed,
    API_HOST: parsed.API_HOST || "0.0.0.0",
    API_PORT: parsed.PORT ?? parsed.API_PORT ?? 3001,
    ADMIN_SESSION_SECRET: adminSessionSecret,
    WHATSAPP_PROVIDER: whatsappProvider,
    PAYMENT_PROVIDER: paymentProvider,
    IMAGE_PROVIDER: imageProvider,
    STORAGE_PROVIDER: storageProvider,
  };
}
