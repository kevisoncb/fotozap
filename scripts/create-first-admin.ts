/**
 * Script to create the first admin user
 *
 * Usage: tsx scripts/create-first-admin.ts
 */

import { PrismaClient } from "../generated/prisma/client.js";
import bcrypt from "bcrypt";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const prisma = new PrismaClient();
const rl = readline.createInterface({ input, output });

async function main() {
  console.log("=== FotoZap IA - Criar Primeiro Admin ===\n");

  // Verifica se já existe algum admin
  const existingAdmin = await prisma.adminUser.findFirst();

  if (existingAdmin) {
    console.log("⚠️  Já existe pelo menos um admin cadastrado.");
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Role: ${existingAdmin.role}`);
    console.log(`   Status: ${existingAdmin.status}\n`);

    const continueAnswer = await rl.question("Deseja criar outro admin? (s/n): ");

    if (continueAnswer.toLowerCase() !== "s") {
      console.log("\nOperação cancelada.");
      rl.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  // Coleta dados do novo admin
  const email = await rl.question("\nEmail: ");
  const password = await rl.question("Senha (min 8 caracteres): ");
  const name = await rl.question("Nome (opcional): ");

  // Validações
  if (!email || !email.includes("@")) {
    console.error("❌ Email inválido!");
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error("❌ Senha deve ter no mínimo 8 caracteres!");
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  // Verifica se email já existe
  const existing = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    console.error("❌ Email já cadastrado!");
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  // Hash da senha
  console.log("\n🔐 Gerando hash da senha...");
  const passwordHash = await bcrypt.hash(password, 12);

  // Cria admin
  console.log("✨ Criando admin...");
  const admin = await prisma.adminUser.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("\n✅ Admin criado com sucesso!");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Nome: ${admin.name || "(não informado)"}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Status: ${admin.status}`);
  console.log(`\n🔑 Use estas credenciais para fazer login no painel admin.`);

  rl.close();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  prisma.$disconnect();
  process.exit(1);
});
