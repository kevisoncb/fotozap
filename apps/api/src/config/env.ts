import { z } from "zod";

const boolish = z
  .string()
  .optional()
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  CONVERSATION_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().default(10),
  MAX_GENERATIONS_PER_HOUR: z.coerce.number().int().positive().default(10),
  IMAGE_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  PAYMENT_EXPIRATION_MINUTES: z.coerce.number().int().positive().default(30),
  INPUT_RETENTION_HOURS: z.coerce.number().positive().default(24),
  OUTPUT_RETENTION_DAYS: z.coerce.number().positive().default(7),
  DISPLAY_TIMEZONE: z.string().default("America/Sao_Paulo"),
  CURRENCY: z.string().default("BRL"),
  WHATSAPP_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  PAYMENT_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  IMAGE_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  STORAGE_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  IMAGE_PROVIDER_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  ADMIN_SESSION_SECRET: z.string().min(16).optional(),
  STRICT_ENV: boolish,
});

export type AppEnv = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = schema.parse(source);
  const production = parsed.NODE_ENV === "production";

  if (production) {
    const missing: string[] = [];
    if (!parsed.DATABASE_URL) missing.push("DATABASE_URL");
    if (!parsed.REDIS_URL) missing.push("REDIS_URL");
    if (!parsed.ADMIN_SESSION_SECRET) missing.push("ADMIN_SESSION_SECRET");
    if (missing.length > 0) {
      throw new Error(`Missing required production env: ${missing.join(", ")}`);
    }
  }

  return parsed;
}
