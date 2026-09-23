import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  await prisma.product.upsert({
    where: { slug: "demo-studio-portrait" },
    update: {},
    create: {
      name: "Retrato de estúdio",
      slug: "demo-studio-portrait",
      description: "Transforma a foto enviada em um retrato de estúdio.",
      priceCents: 299,
      currency: "BRL",
      prompt:
        "Professional studio portrait of the person in {{USER_IMAGE}}, clean lighting, photorealistic, keep identity.",
      active: true,
      sortOrder: 1,
      provider: "mock",
      model: "mock-v1",
      contentPolicy: "ALLOWED",
    },
  });

  await prisma.product.upsert({
    where: { slug: "demo-illustrated" },
    update: {},
    create: {
      name: "Ilustração",
      slug: "demo-illustrated",
      description: "Versão ilustrada da foto enviada.",
      priceCents: 399,
      currency: "BRL",
      prompt:
        "Illustrated version of the person in {{USER_IMAGE}}, high quality, keep facial identity.",
      active: true,
      sortOrder: 2,
      provider: "mock",
      model: "mock-v1",
      contentPolicy: "ALLOWED",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
