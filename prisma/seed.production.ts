/**
 * Production Seed Script
 * 
 * Seeds only essential data for production:
 * - Product catalog
 * - No test users or orders
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding production database...");

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: "retro" },
      update: {},
      create: {
        name: "Foto Estilo Retro",
        slug: "retro",
        description: "Transforme sua foto em arte retrô vintage dos anos 80",
        priceCents: 500, // R$ 5,00
        currency: "BRL",
        prompt:
          "vintage retro 1980s style photo, warm analog tones, film grain texture, nostalgic aesthetic",
        active: true,
        sortOrder: 1,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    }),

    prisma.product.upsert({
      where: { slug: "futurista" },
      update: {},
      create: {
        name: "Foto Estilo Futurista",
        slug: "futurista",
        description: "Transforme sua foto em arte cyberpunk futurista",
        priceCents: 600, // R$ 6,00
        currency: "BRL",
        prompt:
          "futuristic cyberpunk style, neon lights, high-tech atmosphere, digital art aesthetic",
        active: true,
        sortOrder: 2,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    }),

    prisma.product.upsert({
      where: { slug: "cartoon" },
      update: {},
      create: {
        name: "Foto Estilo Cartoon",
        slug: "cartoon",
        description: "Transforme sua foto em desenho animado 3D",
        priceCents: 500, // R$ 5,00
        currency: "BRL",
        prompt:
          "3D cartoon style illustration, pixar-like rendering, vibrant colors, playful aesthetic",
        active: true,
        sortOrder: 3,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    }),

    prisma.product.upsert({
      where: { slug: "pintura" },
      update: {},
      create: {
        name: "Foto Estilo Pintura",
        slug: "pintura",
        description: "Transforme sua foto em pintura artística",
        priceCents: 700, // R$ 7,00
        currency: "BRL",
        prompt:
          "oil painting style, artistic brushstrokes, impressionist aesthetic, gallery-quality art",
        active: true,
        sortOrder: 4,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  console.log("\n📦 Production seed completed!");
  console.log("\n⚠️  NEXT STEPS:");
  console.log("   1. Create first admin: npm run admin:create");
  console.log("   2. Verify products at /products endpoint");
  console.log("   3. Test WhatsApp webhook connection");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
