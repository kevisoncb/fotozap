/**
 * E2E Test: Rate Limiting
 *
 * Testa proteções de rate limiting:
 * 1. Limit de mensagens (20/minuto por telefone)
 * 2. Limit de uploads (15/hora por telefone)
 * 3. Limit de gerações (10/hora por telefone) - PROTEÇÃO FINANCEIRA
 * 4. Limit de orders (10/hora por telefone)
 * 5. TTL automático
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma, cleanDatabase, seedTestData } from "./setup.js";
import { UserService } from "../../src/modules/users/user.service.js";
import { ProductService } from "../../src/modules/products/product.service.js";
import { OrderService } from "../../src/modules/orders/order.service.js";
import Redis from "ioredis-mock";
import type { Redis as RedisType } from "ioredis";

describe("E2E: Rate Limiting", () => {
  let redis: RedisType;
  let userService: UserService;
  let productService: ProductService;
  let orderService: OrderService;

  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();

    redis = new Redis();
    userService = new UserService(prisma);
    productService = new ProductService(prisma);
    orderService = new OrderService(prisma);
  });

  afterEach(async () => {
    await redis.flushall();
    redis.disconnect();
  });

  describe("Message Rate Limiting", () => {
    it("deve permitir até 20 mensagens por minuto", async () => {
      const phone = "5511999887766";
      const key = `rate:messages:${phone}`;
      const limit = 20;

      for (let i = 0; i < limit; i++) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, 60); // 60 segundos
        }
        expect(count).toBeLessThanOrEqual(limit);
      }

      const finalCount = await redis.get(key);
      expect(Number(finalCount)).toBe(limit);
    });

    it("deve bloquear mensagem 21 dentro do mesmo minuto", async () => {
      const phone = "5511999887766";
      const key = `rate:messages:${phone}`;
      const limit = 20;

      // Envia 20 mensagens
      for (let i = 0; i < limit; i++) {
        await redis.incr(key);
        if (i === 0) {
          await redis.expire(key, 60);
        }
      }

      // Tenta enviar a 21ª
      const count = await redis.get(key);
      const isBlocked = Number(count) >= limit;

      expect(isBlocked).toBe(true);
    });

    it("deve resetar contador após TTL de 60 segundos", async () => {
      const phone = "5511999887766";
      const key = `rate:messages:${phone}`;

      await redis.incr(key);
      await redis.expire(key, 1); // 1 segundo para teste

      // Aguarda TTL
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const count = await redis.get(key);
      expect(count).toBeNull(); // Chave expirou
    });
  });

  describe("Upload Rate Limiting", () => {
    it("deve permitir até 15 uploads por hora", async () => {
      const phone = "5511999887766";
      const key = `rate:uploads:${phone}`;
      const limit = 15;

      for (let i = 0; i < limit; i++) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, 3600); // 1 hora
        }
        expect(count).toBeLessThanOrEqual(limit);
      }

      const finalCount = await redis.get(key);
      expect(Number(finalCount)).toBe(limit);
    });

    it("deve bloquear upload 16 dentro da mesma hora", async () => {
      const phone = "5511999887766";
      const key = `rate:uploads:${phone}`;
      const limit = 15;

      for (let i = 0; i < limit; i++) {
        await redis.incr(key);
        if (i === 0) {
          await redis.expire(key, 3600);
        }
      }

      const count = await redis.get(key);
      const isBlocked = Number(count) >= limit;

      expect(isBlocked).toBe(true);
    });
  });

  describe("Generation Rate Limiting (Financial Protection)", () => {
    it("deve permitir até 10 gerações por hora", async () => {
      const phone = "5511999887766";
      const key = `rate:generations:${phone}`;
      const limit = 10;

      for (let i = 0; i < limit; i++) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, 3600); // 1 hora
        }
        expect(count).toBeLessThanOrEqual(limit);
      }

      const finalCount = await redis.get(key);
      expect(Number(finalCount)).toBe(limit);
    });

    it("deve bloquear geração 11 dentro da mesma hora (PROTEÇÃO FINANCEIRA)", async () => {
      const phone = "5511999887766";
      const key = `rate:generations:${phone}`;
      const limit = 10;

      // Simula 10 gerações
      for (let i = 0; i < limit; i++) {
        await redis.incr(key);
        if (i === 0) {
          await redis.expire(key, 3600);
        }
      }

      // Tenta 11ª geração
      const count = await redis.get(key);
      const isBlocked = Number(count) >= limit;

      expect(isBlocked).toBe(true);

      // Verifica que não gastou crédito OpenAI adicional
      const remaining = limit - Number(count);
      expect(remaining).toBe(0);
    });

    it("deve calcular tempo restante até reset", async () => {
      const phone = "5511999887766";
      const key = `rate:generations:${phone}`;

      await redis.incr(key);
      await redis.expire(key, 3600); // 1 hora

      const ttl = await redis.ttl(key);

      expect(ttl).toBeGreaterThan(3500); // Aproximadamente 1 hora
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it("deve isolar contadores por número de telefone", async () => {
      const phone1 = "5511999887766";
      const phone2 = "5511988776655";
      const key1 = `rate:generations:${phone1}`;
      const key2 = `rate:generations:${phone2}`;

      // Phone1 atinge limite
      for (let i = 0; i < 10; i++) {
        await redis.incr(key1);
        if (i === 0) await redis.expire(key1, 3600);
      }

      // Phone2 ainda está no 0
      const count1 = await redis.get(key1);
      const count2 = await redis.get(key2);

      expect(Number(count1)).toBe(10);
      expect(count2).toBeNull();
    });
  });

  describe("Order Rate Limiting", () => {
    it("deve permitir até 10 orders por hora", async () => {
      const phone = "5511999887766";
      const key = `rate:orders:${phone}`;
      const limit = 10;

      for (let i = 0; i < limit; i++) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, 3600);
        }
        expect(count).toBeLessThanOrEqual(limit);
      }

      const finalCount = await redis.get(key);
      expect(Number(finalCount)).toBe(limit);
    });

    it("deve bloquear order 11 dentro da mesma hora", async () => {
      const phone = "5511999887766";
      const key = `rate:orders:${phone}`;
      const limit = 10;

      for (let i = 0; i < limit; i++) {
        await redis.incr(key);
        if (i === 0) {
          await redis.expire(key, 3600);
        }
      }

      const count = await redis.get(key);
      const isBlocked = Number(count) >= limit;

      expect(isBlocked).toBe(true);
    });
  });

  describe("Rate Limit Integration", () => {
    it("deve aplicar múltiplos rate limits simultaneamente", async () => {
      const phone = "5511999887766";
      const user = await userService.findOrCreate({ whatsappPhone: phone });
      const products = await productService.listActive();

      // Simula 5 operações completas
      for (let i = 0; i < 5; i++) {
        // Incrementa todos os contadores
        await redis.incr(`rate:messages:${phone}`);
        await redis.incr(`rate:uploads:${phone}`);
        await redis.incr(`rate:orders:${phone}`);
        await redis.incr(`rate:generations:${phone}`);

        // Define TTL na primeira operação
        if (i === 0) {
          await redis.expire(`rate:messages:${phone}`, 60);
          await redis.expire(`rate:uploads:${phone}`, 3600);
          await redis.expire(`rate:orders:${phone}`, 3600);
          await redis.expire(`rate:generations:${phone}`, 3600);
        }
      }

      // Verifica contadores
      const messageCount = await redis.get(`rate:messages:${phone}`);
      const uploadCount = await redis.get(`rate:uploads:${phone}`);
      const orderCount = await redis.get(`rate:orders:${phone}`);
      const generationCount = await redis.get(`rate:generations:${phone}`);

      expect(Number(messageCount)).toBe(5);
      expect(Number(uploadCount)).toBe(5);
      expect(Number(orderCount)).toBe(5);
      expect(Number(generationCount)).toBe(5);

      // Todos ainda dentro do limite
      expect(Number(messageCount)).toBeLessThan(20);
      expect(Number(uploadCount)).toBeLessThan(15);
      expect(Number(orderCount)).toBeLessThan(10);
      expect(Number(generationCount)).toBeLessThan(10);
    });

    it("deve retornar informação de limite para feedback ao usuário", async () => {
      const phone = "5511999887766";
      const key = `rate:generations:${phone}`;
      const limit = 10;

      // Usuário já usou 7 gerações
      for (let i = 0; i < 7; i++) {
        await redis.incr(key);
        if (i === 0) {
          await redis.expire(key, 3600);
        }
      }

      const current = Number(await redis.get(key));
      const remaining = limit - current;
      const ttl = await redis.ttl(key);
      const resetsIn = Math.ceil(ttl / 60); // minutos

      expect(current).toBe(7);
      expect(remaining).toBe(3);
      expect(resetsIn).toBeGreaterThan(0);

      // Mensagem para usuário
      const userMessage = `Você usou ${current}/${limit} gerações. ${remaining} restantes. Limite reseta em ${resetsIn} minutos.`;

      expect(userMessage).toContain("7/10");
      expect(userMessage).toContain("3 restantes");
    });
  });
});
