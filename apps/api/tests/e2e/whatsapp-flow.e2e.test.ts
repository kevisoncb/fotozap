/**
 * E2E Test: WhatsApp Flow Complete
 *
 * Testa o fluxo end-to-end de um usuário via WhatsApp:
 * 1. Envio de "oi" → Menu
 * 2. Seleção de produto (1)
 * 3. Envio de imagem
 * 4. Recebimento de PIX
 * 5. Simulação de pagamento aprovado
 * 6. Geração de imagem (worker)
 * 7. Entrega via WhatsApp
 */

import { describe, it, expect, beforeEach } from "vitest";
import { prisma, cleanDatabase, seedTestData } from "./setup.js";
import { UserService } from "../../src/modules/users/user.service.js";
import { ProductService } from "../../src/modules/products/product.service.js";
import { OrderService } from "../../src/modules/orders/order.service.js";
import { PaymentService } from "../../src/modules/payments/payment.service.js";
import { GenerationService } from "../../src/modules/generations/generation.service.js";
import { MessageService } from "../../src/modules/messages/message.service.js";
import { WebhookService } from "../../src/modules/webhooks/webhook.service.js";

describe("E2E: WhatsApp Flow", () => {
  let userService: UserService;
  let productService: ProductService;
  let orderService: OrderService;
  let paymentService: PaymentService;
  let generationService: GenerationService;
  let messageService: MessageService;
  let webhookService: WebhookService;

  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();

    // Inicializa services
    userService = new UserService(prisma);
    productService = new ProductService(prisma);
    orderService = new OrderService(prisma);
    paymentService = new PaymentService(prisma);
    generationService = new GenerationService(prisma);
    messageService = new MessageService(prisma);
    webhookService = new WebhookService(prisma);
  });

  it("deve completar o fluxo WhatsApp → PIX → Geração → Entrega", async () => {
    const whatsappPhone = "5511999887766";

    // 1. Usuário envia "oi" (primeira interação)
    const user = await userService.findOrCreate({ whatsappPhone });
    expect(user.whatsappPhone).toBe(whatsappPhone);
    expect(user.status).toBe("ACTIVE");

    // 2. Cria mensagem de entrada
    await messageService.create({
      userId: user.id,
      externalMessageId: "msg-1",
      direction: "INBOUND",
      type: "text",
      content: "oi",
    });

    // 3. Usuário seleciona produto "1" (retro)
    const products = await productService.listActive();
    expect(products.length).toBeGreaterThan(0);

    const selectedProduct = products[0];
    expect(selectedProduct?.slug).toBe("retro");

    // 4. Cria pedido draft
    const order = await orderService.create({
      userId: user.id,
      productId: selectedProduct!.id,
      amountCents: selectedProduct!.priceCents,
    });

    expect(order.status).toBe("CREATED");
    expect(order.amountCents).toBe(500);

    // 5. Usuário envia imagem (simulado)
    const inputImageKey = `users/${user.id}/input/test-image.jpg`;
    await orderService.setInputImage(order.id, inputImageKey);

    // 6. Sistema transiciona para AWAITING_PAYMENT
    const updatedOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "AWAITING_PAYMENT",
    });

    expect(updatedOrder.status).toBe("AWAITING_PAYMENT");
    expect(updatedOrder.inputImageKey).toBe(inputImageKey);

    // 7. Sistema cria pagamento PIX
    const payment = await paymentService.create({
      orderId: order.id,
      provider: "mercadopago",
      externalPaymentId: "mp-12345",
      amountCents: order.amountCents,
      currency: "BRL",
      pixCopyPaste: "00020126580014br.gov.bcb.pix...",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    });

    expect(payment.status).toBe("CREATED");
    expect(payment.pixCopyPaste).toBeTruthy();

    // 8. Webhook de pagamento aprovado (simulado)
    await webhookService.recordEvent({
      provider: "mercadopago",
      externalEventId: "evt-123",
      eventType: "payment.updated",
      payload: { payment_id: "mp-12345", status: "approved" },
    });

    // 9. Sistema marca pagamento como aprovado
    const changed = await paymentService.markApproved(payment.id);
    expect(changed).toBe(true);
    
    const approvedPayment = await paymentService.findById(payment.id);
    expect(approvedPayment?.status).toBe("APPROVED");

    // 10. Sistema transiciona pedido para PAID
    const paidOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "PAID",
    });

    expect(paidOrder.status).toBe("PAID");
    expect(paidOrder.paidAt).toBeTruthy();

    // 11. Worker de geração (simulado)
    // Transiciona para PROCESSING
    const processingOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "PROCESSING",
    });

    expect(processingOrder.status).toBe("PROCESSING");

    // 12. Cria generation record
    const generation = await generationService.create({
      orderId: order.id,
      provider: "openai",
      model: "dall-e-3",
      prompt: "vintage retro style photo, warm tones, film grain",
      inputUrl: `https://storage.example.com/${inputImageKey}`,
    });

    expect(generation.status).toBe("CREATED");

    // 13. Atualiza generation para SUCCEEDED
    const succeededGeneration = await generationService.updateStatus({
      generationId: generation.id,
      status: "SUCCEEDED",
      outputUrl: `https://storage.example.com/users/${user.id}/output/generated-${order.id}.jpg`,
    });

    expect(succeededGeneration.status).toBe("SUCCEEDED");
    expect(succeededGeneration.outputUrl).toBeTruthy();

    // 14. Sistema transiciona para GENERATION_COMPLETED
    const completedGenOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "GENERATION_COMPLETED",
    });

    expect(completedGenOrder.status).toBe("GENERATION_COMPLETED");

    // 15. Sistema transiciona para DELIVERY_PENDING
    const deliveryPendingOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "DELIVERY_PENDING",
    });

    expect(deliveryPendingOrder.status).toBe("DELIVERY_PENDING");

    // 16. Sistema envia imagem via WhatsApp (simulado)
    await messageService.create({
      userId: user.id,
      externalMessageId: "msg-out-1",
      direction: "OUTBOUND",
      type: "image",
      mediaId: "whatsapp-media-123",
    });

    // 17. Sistema transiciona para COMPLETED
    const completedOrder = await orderService.transitionStatus({
      orderId: order.id,
      newStatus: "COMPLETED",
    });

    expect(completedOrder.status).toBe("COMPLETED");
    expect(completedOrder.completedAt).toBeTruthy();

    // 18. Validações finais
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: true,
        product: true,
        payments: true,
        generations: true,
      },
    });

    expect(finalOrder).toBeTruthy();
    expect(finalOrder?.status).toBe("COMPLETED");
    expect(finalOrder?.payments).toHaveLength(1);
    expect(finalOrder?.payments[0]?.status).toBe("APPROVED");
    expect(finalOrder?.generations).toHaveLength(1);
    expect(finalOrder?.generations[0]?.status).toBe("SUCCEEDED");

    // 19. Verifica mensagens criadas
    const messages = await prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    expect(messages.length).toBeGreaterThanOrEqual(2); // Pelo menos 1 inbound + 1 outbound
  });

  it("deve falhar se produto não existir", async () => {
    const user = await userService.findOrCreate({ whatsappPhone: "5511999887766" });

    await expect(
      orderService.create({
        userId: user.id,
        productId: "invalid-product-id",
        amountCents: 500,
      }),
    ).rejects.toThrow();
  });

  it("deve impedir transição inválida de status", async () => {
    const user = await userService.findOrCreate({ whatsappPhone: "5511999887766" });
    const products = await productService.listActive();
    const order = await orderService.create({
      userId: user.id,
      productId: products[0]!.id,
      amountCents: products[0]!.priceCents,
    });

    // Tentar pular de CREATED direto para COMPLETED
    await expect(
      orderService.transitionStatus({
        orderId: order.id,
        newStatus: "COMPLETED",
      }),
    ).rejects.toThrow();
  });

  it("deve registrar webhook duplicado apenas uma vez", async () => {
    const payload = { payment_id: "mp-12345", status: "approved" };

    const event1 = await webhookService.recordEvent({
      provider: "mercadopago",
      externalEventId: "evt-123",
      eventType: "payment.updated",
      payload,
    });

    expect(event1?.status).toBe("RECEIVED");

    // Tentar registrar novamente
    const event2 = await webhookService.recordEvent({
      provider: "mercadopago",
      externalEventId: "evt-123",
      eventType: "payment.updated",
      payload,
    });

    expect(event2?.status).toBe("DUPLICATE");

    // Verificar que só há 1 evento no banco
    const events = await prisma.webhookEvent.findMany({
      where: {
        provider: "mercadopago",
        externalEventId: "evt-123",
      },
    });

    expect(events).toHaveLength(1);
  });
});
