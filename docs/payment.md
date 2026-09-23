# Payment Integration

Status: **IMPLEMENTADO** (mock e Mercado Pago).

## Providers

### MockPaymentProvider

- Usado quando `PAYMENT_PROVIDER=mock`
- Cria PIX simulado com QR code mock
- **Auto-aprova** pagamentos após 5 segundos
- Ideal para desenvolvimento e testes

### MercadoPagoProvider

- Usado quando `PAYMENT_PROVIDER=real`
- Integração com Mercado Pago API v1
- Endpoint: `https://api.mercadopago.com/v1/payments`
- Requer:
  - `MERCADOPAGO_ACCESS_TOKEN`
  - `MERCADOPAGO_WEBHOOK_SECRET`

## Payment Flow

### 1. Criar Pix

```typescript
const pix = await paymentFlowService.createPixForOrder(orderId);

// Retorna:
{
  pixCode: string;          // Código Pix copia-e-cola
  pixQrCodeUrl: string;     // URL do QR code
  expiresAt: Date;          // Expiração
}
```

**Validações:**
- Order deve estar em status `PENDING_PAYMENT`
- Product deve existir
- Gera Payment record com `status=PENDING`

### 2. Webhook (notificação de pagamento)

**POST /webhooks/mercadopago**

Headers:
- `x-signature`: HMAC SHA-256 do body com `MERCADOPAGO_WEBHOOK_SECRET`

Body:
```json
{
  "id": 12345,
  "type": "payment",
  "data": {
    "id": 67890
  }
}
```

**Processamento:**
1. Valida assinatura
2. Deduplica por `eventId` (tabela `WebhookEvent`)
3. Consulta status do pagamento via API
4. Se `approved`: marca Payment como `APPROVED` e Order como `PAID`
5. Marca webhook como `SUCCESS`

**Idempotência:**
- `WebhookEvent.eventId` unique constraint
- `Payment.markApproved` retorna `false` se já estava aprovado
- Order transitions validam estado atual

### 3. Estados de pagamento

**Payment.status:**
- `PENDING` → aguardando pagamento
- `APPROVED` → pago
- `REJECTED` → recusado
- `CANCELLED` → cancelado/expirado

**Order.status** após pagamento:
- `PENDING_PAYMENT` → `PAID` (após webhook approved)

## PaymentFlowService

Orquestra o fluxo completo:

```typescript
// Criar Pix
await paymentFlowService.createPixForOrder(orderId);

// Processar aprovação (chamado pelo webhook)
await paymentFlowService.handlePaymentApproved(externalPaymentId);
```

## MercadoPago Webhook Handler

- Valida assinatura
- Processa assincronamente (reply 200, depois processa)
- Registra evento em `WebhookEvent`
- Marca como `SKIPPED` se não for tipo "payment"
- Marca como `ERROR` em caso de falha

## Configuração no Mercado Pago

1. Acesse o painel: https://www.mercadopago.com.br/developers
2. Crie uma aplicação
3. Configure webhook URL: `https://seu-dominio.com/webhooks/mercadopago`
4. Eventos: `payment`
5. Copie o `Access Token` e configure `MERCADOPAGO_ACCESS_TOKEN`
6. Gere um `MERCADOPAGO_WEBHOOK_SECRET` (UUID ou string aleatória)

## Expiração

- Default: `PAYMENT_EXPIRATION_MINUTES` (30 min)
- Configurado por environment variable
- Mercado Pago respeita `date_of_expiration`
- Mock não expira automaticamente (precisa worker de cleanup)

## Testes

- `payment.provider.test.ts` — mock provider (4 testes)
- `payment-flow.service.test.ts` — fluxo completo (4 testes)

Total: **61 testes passando** (14 suites)

## Fluxo completo (WhatsApp → Pix)

1. Usuário envia foto
2. `WhatsAppImageHandler` valida e faz upload
3. Order transita para `PENDING_PAYMENT`
4. `paymentFlowService.createPixForOrder` gera Pix
5. Bot envia código Pix no WhatsApp
6. Usuário paga pelo app bancário
7. Mercado Pago envia webhook
8. `MercadoPagoWebhookHandler` processa
9. Payment → `APPROVED`, Order → `PAID`
10. (Fase 6: worker inicia geração de imagem)
