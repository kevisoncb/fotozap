/**
 * Script to create test admin (development only)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@test.com";
  const password = "admin123";

  // Check if admin already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("✅ Admin already exists!");
    console.log(`   Email: ${existing.email}`);
    console.log(`   Role: ${existing.role}`);
    console.log(`   Status: ${existing.status}`);
    console.log(`\n🔑 Use these credentials to login:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    await prisma.$disconnect();
    return;
  }

  // Create admin
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name: "Admin Test",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("✅ Admin de teste criado com sucesso!");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Nome: ${admin.name}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Status: ${admin.status}`);
  console.log(`\n🔑 Use estas credenciais para fazer login:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  prisma.$disconnect();
  process.exit(1);
});
