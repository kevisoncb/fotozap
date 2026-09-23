# Workers & Queues (BullMQ)

Status: **IMPLEMENTADO**.

## Overview

Sistema de filas assíncronas baseado em Redis via BullMQ para processar:
- Geração de imagens (após pagamento aprovado)
- Limpeza de arquivos antigos (periódica)
- Expiração de pagamentos (periódica)

## Queues

### 1. Generation Queue (`generation`)

**Quando enfileira:**
- `PaymentFlowService.handlePaymentApproved()` adiciona job quando Payment → `APPROVED`

**Job data:**
```typescript
{
  orderId: string;
  userId: string;
  productId: string;
  inputImageKey: string;
}
```

**Configuração:**
- `attempts`: 3
- `backoff`: exponencial, 5s
- `concurrency`: `IMAGE_WORKER_CONCURRENCY` (padrão 5)
- `removeOnComplete`: últimos 100, até 24h
- `removeOnFail`: últimos 500, até 3 dias

### 2. Cleanup Queue (`cleanup`)

**Quando enfileira:**
- Scheduler periódico: a cada `CLEANUP_INTERVAL_HOURS` (padrão 6h)
- Manual: via API admin (futuro)

**Job data:**
```typescript
{
  reason: "scheduled" | "manual";
  dryRun?: boolean;
}
```

**Configuração:**
- `attempts`: 2
- `backoff`: fixo, 60s
- `concurrency`: 1 (serializado)

### 3. Expiration Queue (`expiration`)

**Quando enfileira:**
- Scheduler periódico: a cada `EXPIRATION_CHECK_INTERVAL_MINUTES` (padrão 5min)
- Manual: via API admin (futuro)

**Job data:**
```typescript
{
  reason: "scheduled" | "manual";
}
```

**Configuração:**
- `attempts`: 2
- `backoff`: fixo, 30s
- `concurrency`: 1 (serializado)

---

## Workers

### GenerationWorker

**Responsabilidade:** Gerar imagem processada e entregar via WhatsApp.

**Fluxo completo:**

1. **Busca dados** (Order, Product, User)
2. **Cria Generation** record
3. **Atualiza status:** Order → `PROCESSING`, Generation → `PROCESSING`
4. **Notifica usuário:** "🎨 Gerando sua imagem..."
5. **Obtém URL** da imagem de input (storage)
6. **Chama AI provider** (OpenAI DALL-E)
7. **Baixa imagem gerada** da URL temporária
8. **Upload para storage** (`users/{userId}/output/{generationId}.jpg`)
9. **Atualiza Generation:** status → `SUCCEEDED`, `outputImageKey`
10. **Atualiza Order:** `PROCESSING` → `GENERATION_COMPLETED` → `DELIVERY_PENDING`
11. **Envia via WhatsApp:** imagem + caption "✅ Sua imagem está pronta!"
12. **Finaliza Order:** `DELIVERY_PENDING` → `COMPLETED`

**Em caso de erro:**
- Generation → `FAILED` (com `errorMessage`)
- Order → `FAILED`
- WhatsApp: "❌ Erro ao processar sua imagem. Entre em contato com o suporte."
- Job falha e entra em retry (até 3 tentativas)

**Logs:** Cada etapa registrada via `job.log()` para debugging.

---

### CleanupWorker

**Responsabilidade:** Remover imagens antigas do storage baseado em retention policies.

**Lógica:**

1. **Input images:**
   - Busca Orders com `inputImageKey != null` e `createdAt < now - INPUT_RETENTION_HOURS`
   - Delete do storage
   - Atualiza Order: `inputImageKey = null`

2. **Output images:**
   - Busca Generations com `outputImageKey != null` e `completedAt < now - OUTPUT_RETENTION_DAYS`
   - Delete do storage
   - Atualiza Generation: `outputImageKey = null`

**Dry run:** Se `dryRun=true`, apenas lista sem deletar.

**Retorno:**
```typescript
{
  inputImagesDeleted: number;
  outputImagesDeleted: number;
  dryRun: boolean;
}
```

**Configuração padrão:**
- `INPUT_RETENTION_HOURS`: 24h
- `OUTPUT_RETENTION_DAYS`: 7 dias

---

### ExpirationWorker

**Responsabilidade:** Cancelar pagamentos e pedidos expirados.

**Lógica:**

1. Busca Payments com `status=PENDING` e `expiresAt < now`
2. Para cada:
   - Payment → `CANCELLED`
   - Se Order está em `PENDING_PAYMENT` → `CANCELLED`

**Retorno:**
```typescript
{
  expiredPayments: number;
  cancelledCount: number;
}
```

**Configuração padrão:**
- `PAYMENT_EXPIRATION_MINUTES`: 30 min

---

## Schedulers

### CleanupScheduler

- **Intervalo:** `CLEANUP_INTERVAL_HOURS` (padrão 6h)
- **Startup:** Executa imediatamente ao iniciar
- **Periódico:** `setInterval` enfileira novo job

### ExpirationScheduler

- **Intervalo:** `EXPIRATION_CHECK_INTERVAL_MINUTES` (padrão 5min)
- **Startup:** Executa imediatamente ao iniciar
- **Periódico:** `setInterval` enfileira novo job

---

## Integração no `server.ts`

```typescript
// Criar queues
const generationQueue = createGenerationQueue(redis);
const cleanupQueue = createCleanupQueue(redis);
const expirationQueue = createExpirationQueue(redis);

// Criar workers
const generationWorker = createGenerationWorker({ ... });
const cleanupWorker = createCleanupWorker({ ... });
const expirationWorker = createExpirationWorker({ ... });

// Start workers
await generationWorker.run();
await cleanupWorker.run();
await expirationWorker.run();

// Start schedulers
const cleanupTimer = scheduleCleanupJobs(cleanupQueue, ...);
const expirationTimer = scheduleExpirationJobs(expirationQueue, ...);

// Graceful shutdown
app.addHook("onClose", async () => {
  clearInterval(cleanupTimer);
  clearInterval(expirationTimer);
  await generationWorker.close();
  await cleanupWorker.close();
  await expirationWorker.close();
  await generationQueue.close();
  await cleanupQueue.close();
  await expirationQueue.close();
});
```

---

## Monitoring

**Eventos de worker:**
- `completed`: Job finalizado com sucesso
- `failed`: Job falhou (após todas as tentativas)
- Logs: `console.log` e `console.error` para cada evento

**Job logs:**
- Acessíveis via `job.log()` durante execução
- Útil para debugging de falhas

**Métricas futuras (Fase 11):**
- Taxa de sucesso/falha
- Tempo médio de geração
- Tamanho da fila
- Workers ativos
- Custos OpenAI

---

## Redis Keys Pattern

BullMQ usa prefixos Redis:
- `bull:generation:*` — jobs de geração
- `bull:cleanup:*` — jobs de limpeza
- `bull:expiration:*` — jobs de expiração

**Namespaces:**
- `waiting` — jobs aguardando processamento
- `active` — jobs em execução
- `completed` — jobs finalizados
- `failed` — jobs com erro

---

## Error Handling

### Retry Strategy

**GenerationWorker:**
- 3 tentativas
- Backoff exponencial: 5s, 25s, 125s
- Após falha final: Order → `FAILED`

**CleanupWorker:**
- 2 tentativas
- Backoff fixo: 60s
- Falhas individuais não param o job (continue em caso de erro por arquivo)

**ExpirationWorker:**
- 2 tentativas
- Backoff fixo: 30s
- Falhas individuais não param o job

### Erros conhecidos

| Erro | Causa | Solução |
|------|-------|---------|
| `ORDER_NOT_FOUND` | Order deletado antes de processar | Não retenta |
| `PRODUCT_NOT_FOUND` | Product deletado | Não retenta |
| `USER_NOT_FOUND_OR_NO_PHONE` | User sem WhatsApp | Não retenta |
| `DOWNLOAD_FAILED` | URL OpenAI expirada (>1h) | Retenta |
| `OPENAI_NO_IMAGE_URL` | API retornou sem URL | Retenta |

---

## Fluxo completo (end-to-end)

1. Usuário envia foto → storage
2. Order → `PENDING_PAYMENT`
3. Sistema gera Pix
4. Usuário paga
5. Mercado Pago → webhook
6. `PaymentFlowService` → enfileira job
7. **GenerationWorker pega job** (aqui!)
8. Processa → storage → WhatsApp
9. Order → `COMPLETED`

**Tempo total esperado:**
- Pagamento → webhook: instantâneo (< 5s)
- Webhook → enqueue: < 1s
- Queue → worker: < 1s (se worker livre)
- Geração OpenAI: 10-30s
- Upload + WhatsApp: 2-5s
- **Total: ~15-40 segundos** após pagamento

---

## Environment Variables

```bash
IMAGE_WORKER_CONCURRENCY=5           # Workers simultâneos de geração
INPUT_RETENTION_HOURS=24             # Retenção de input images
OUTPUT_RETENTION_DAYS=7              # Retenção de output images
CLEANUP_INTERVAL_HOURS=6             # Intervalo de limpeza
EXPIRATION_CHECK_INTERVAL_MINUTES=5  # Intervalo de expiração
```

---

## Testes

Atualmente: **61 testes passando** (integração de workers em Fase 9).

Workers testáveis via:
- Mocks de Prisma, providers
- Job data simulado
- Assertions de chamadas e estados
