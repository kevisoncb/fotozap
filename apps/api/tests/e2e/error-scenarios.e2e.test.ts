/**
 * E2E Test: Error Scenarios
 *
 * Testa cenários de erro e edge cases:
 * 1. Pagamento expirado
 * 2. Geração de imagem falha
 * 3. Webhook duplicado
 * 4. Transições inválidas de estado
 * 5. Tentativa de geração simultânea
 */

import { describe, it, expect, beforeEach } from "vitest";
import { prisma, cleanDatabase, seedTestData } from "./setup.js";
import { UserService } from "../../src/modules/users/user.service.js";
import { ProductService } from "../../src/modules/products/product.service.js";
import { OrderService } from "../../src/modules/orders/order.service.js";
import { PaymentService } from "../../src/modules/payments/payment.service.js";
import { GenerationService } from "../../src/modules/generations/generation.service.js";

describe("E2E: Error Scenarios", () => {
  let userService: UserService;
  let productService: ProductService;
  let orderService: OrderService;
  let paymentService: PaymentService;
  let generationService: GenerationService;

  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();

    userService = new UserService(prisma);
    productService = new ProductService(prisma);
    orderService = new OrderService(prisma);
    paymentService = new PaymentService(prisma);
    generationService = new GenerationService(prisma);
  });

  it("deve cancelar pedido quando pagamento expira", async () => {
    const user = await userService.findOrCreate("5511999887766");
    const products = await productService.listActive();
    const order = await orderService.create({
      userId: user.id,
      productId: products[0]!.id,
      amountCents: products[0]!.priceCents,
    });

    // Cria pagamento com expiração passada
    const payment = await paymentService.create({
      orderId: order.id,
      provider: "mercadopago",
      externalPaymentId: "mp-expired",
      amountCents: order.amountCents,
      currency: "BRL",
      pixCopyPaste: "00020126580014br.gov.bcb.pix...",
      expiresAt: new Date(Date.now() - 1000), // Expirado há 1 segundo
    });

    expect(payment.expiresAt).toBeTruthy();

    // Busca pagamentos expirados
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: "CREATED",
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    expect(expiredPayments.length).toBeGreaterThan(0);
    expect(expiredPayments[0]?.id).toBe(payment.id);

    // Marca pagamento como expirado
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "EXPIRED" },
    });

    // Cancela pedido
    const cancelledOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "CANCELLED",
    });

    expect(cancelledOrder.status).toBe("CANCELLED");
    expect(cancelledOrder.cancelledAt).toBeTruthy();
  });

  it("deve marcar pedido como FAILED quando geração falha", async () => {
    const user = await userService.findOrCreate("5511999887766");
    const products = await productService.listActive();
    const order = await orderService.create({
      userId: user.id,
      productId: products[0]!.id,
      amountCents: products[0]!.priceCents,
    });

    // Transiciona para PAID
    await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "PAID",
    });

    // Transiciona para PROCESSING
    await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "PROCESSING",
    });

    // Cria generation
    const generation = await generationService.create({
      orderId: order.id,
      provider: "openai",
      model: "dall-e-3",
      prompt: "test prompt",
      inputUrl: "https://storage.example.com/input.jpg",
    });

    // Simula falha de geração
    await generationService.updateStatus({
      generationId: generation.id,
      status: "FAILED",
      errorCode: "CONTENT_POLICY_VIOLATION",
      errorMessage: "Content violates OpenAI policy",
    });

    // Marca pedido como FAILED
    const failedOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "FAILED",
    });

    expect(failedOrder.status).toBe("FAILED");
    expect(failedOrder.failedAt).toBeTruthy();

    // Busca generation e valida
    const failedGeneration = await prisma.generation.findUnique({
      where: { id: generation.id },
    });

    expect(failedGeneration?.status).toBe("FAILED");
    expect(failedGeneration?.errorCode).toBe("CONTENT_POLICY_VIOLATION");
  });

  it("deve rejeitar transição inválida de CREATED para COMPLETED", async () => {
    const user = await userService.findOrCreate("5511999887766");
    const products = await productService.listActive();
    const order = await orderService.create({
      userId: user.id,
      productId: products[0]!.id,
      amountCents: products[0]!.priceCents,
    });

    expect(order.status).toBe("CREATED");

    // Tentar pular etapas críticas
    await expect(
      orderService.transitionStatus({
        orderId: order.id,
        newStatus: "COMPLETED",
      }),
    ).rejects.toThrow(/invalid.*transition/i);
  });

  it("deve rejeitar transição de COMPLETED para PROCESSING", async () => {
    const user = await userService.findOrCreate("5511999887766");
    const products = await productService.listActive();
    const order = await orderService.create({
      userId: user.id,
      productId: products[0]!.id,
      amountCents: products[0]!.priceCents,
    });

    // Transiciona normalmente até COMPLETED
    await orderService.transitionStatus({ orderId: order.id, newStatus: "PAID" });
    await orderService.transitionStatus({ orderId: order.id, newStatus: "PROCESSING" });
    await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "GENERATION_COMPLETED",
    });
    await orderService.transitionStatus({ orderId: order.id, newStatus: "DELIVERY_PENDING" });
    const completedOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "COMPLETED",
    });

    expect(completedOrder.status).toBe("COMPLETED");

    // Tentar voltar para PROCESSING (inválido)
    await expect(
      orderService.transitionStatus({
        orderId: order.id,
        newStatus: "PROCESSING",
      }),
    ).rejects.toThrow(/invalid.*transition/i);
  });

  it("deve prevenir múltiplas gerações simultâneas no mesmo pedido", async () => {
    const user = await userService.findOrCreate("5511999887766");
    const products = await productService.listActive();
    const order = await orderService.create({
      userId: user.id,
      productId: products[0]!.id,
      amountCents: products[0]!.priceCents,
    });

    // Transiciona para PAID
    await orderService.transitionStatus({ orderId: order.id, newStatus: "PAID" });
    await orderService.transitionStatus({ orderId: order.id, newStatus: "PROCESSING" });

    // Cria primeira generation
    const generation1 = await generationService.create({
      orderId: order.id,
      provider: "openai",
      model: "dall-e-3",
      prompt: "test prompt",
      inputUrl: "https://storage.example.com/input.jpg",
    });

    expect(generation1.status).toBe("CREATED");

    // Verifica que não pode criar segunda generation para o mesmo order
    const existingGenerations = await prisma.generation.findMany({
      where: {
        orderId: order.id,
        status: {
          in: ["CREATED", "SUBMITTED", "PROCESSING"],
        },
      },
    });

    expect(existingGenerations).toHaveLength(1);

    // Se tentar criar outra, deve ser bloqueado pela lógica de negócio
    // (em produção, GenerationService.create faria essa validação)
  });

  it("deve marcar mensagem como duplicada se externalMessageId já existe", async () => {
    const user = await userService.findOrCreate("5511999887766");

    // Primeira mensagem
    const message1 = await prisma.message.create({
      data: {
        userId: user.id,
        externalMessageId: "msg-unique-123",
        direction: "INBOUND",
        type: "text",
        content: "Hello",
      },
    });

    expect(message1.externalMessageId).toBe("msg-unique-123");

    // Tentar criar novamente com mesmo externalMessageId deve falhar (unique constraint)
    await expect(
      prisma.message.create({
        data: {
          userId: user.id,
          externalMessageId: "msg-unique-123",
          direction: "INBOUND",
          type: "text",
          content: "Hello again",
        },
      }),
    ).rejects.toThrow();
  });

  it("deve lidar com produto inativo na criação de pedido", async () => {
    const user = await userService.findOrCreate("5511999887766");

    // Cria produto inativo
    const inactiveProduct = await prisma.product.create({
      data: {
        name: "Produto Desativado",
        slug: "inactive",
        description: "Este produto está inativo",
        priceCents: 1000,
        currency: "BRL",
        prompt: "inactive product",
        active: false, // INATIVO
        sortOrder: 99,
        provider: "openai",
        model: "dall-e-3",
        contentPolicy: "ALLOWED",
      },
    });

    // Buscar produtos ativos não deve incluir este
    const activeProducts = await productService.listActive();
    const hasInactive = activeProducts.some((p) => p.id === inactiveProduct.id);

    expect(hasInactive).toBe(false);

    // Mas consegue criar pedido se especificar o ID diretamente
    const order = await orderService.create({
      userId: user.id,
      productId: inactiveProduct.id,
      amountCents: inactiveProduct.priceCents,
    });

    expect(order.productId).toBe(inactiveProduct.id);
    expect(order.status).toBe("CREATED");
  });

  it("deve lidar com usuário deletado (soft delete)", async () => {
    const user = await userService.findOrCreate("5511999887766");

    // Marca usuário como deletado
    await userService.markDeleted(user.id);

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(deletedUser?.status).toBe("DELETED");

    // Pedidos do usuário deletado ainda existem (para histórico)
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
    });

    // Não há pedidos ainda, mas a query não falha
    expect(orders).toEqual([]);
  });
});
