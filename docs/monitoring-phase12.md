# 📊 Monitoring & Observability (Fase 12)

**Status:** IMPLEMENTADO  
**Data:** 24/09/2026

---

## 🎯 Objetivo

Implementar observabilidade completa para debugging, performance analysis e alerting em produção.

---

## ✅ Componentes Implementados

### 1. Structured Logging (Pino)
- ✅ Log levels configuráveis (trace, debug, info, warn, error, fatal)
- ✅ JSON structured logs para parsing automatizado
- ✅ Request ID tracking em todos os logs
- ✅ Log redaction para dados sensíveis
- ✅ Pretty print em desenvolvimento

### 2. Request Tracking
- ✅ Unique Request ID por request HTTP
- ✅ Propagação de Request ID para services e workers
- ✅ Correlation entre logs de um mesmo fluxo
- ✅ Trace de duração de requests

### 3. Performance Metrics
- ✅ Response time tracking
- ✅ Database query timing
- ✅ Worker job duration
- ✅ Rate limiting counters
- ✅ Memory and CPU metrics

### 4. Error Tracking
- ✅ Structured error logging
- ✅ Stack traces em erro
- ✅ Error context (request, user, order)
- ✅ Preparação para Sentry integration

### 5. Health Checks Avançados
- ✅ `/health` - Basic health check
- ✅ `/ready` - Readiness probe (DB + Redis)
- ✅ Database connection status
- ✅ Redis connection status
- ✅ Worker status monitoring

---

## 📁 Arquivos de Monitoring

### Principais Arquivos:

1. `apps/api/src/config/logger.ts` - Configuração centralizada do Pino
2. `apps/api/src/middleware/request-id.ts` - Geração e propagação de Request ID
3. `apps/api/src/middleware/request-logger.ts` - Log automático de requests
4. `apps/api/src/monitoring/metrics.ts` - Coleta de métricas
5. `apps/api/src/monitoring/performance.ts` - Performance tracking
6. `docs/monitoring-guide.md` - Guia de uso

---

## 🔧 Configuração

### Variáveis de Ambiente:

```bash
# Log Level (development: debug, production: info)
LOG_LEVEL=info

# Pretty Print (development: true, production: false)
LOG_PRETTY=false

# Sentry DSN (opcional, para error tracking)
SENTRY_DSN=https://...@sentry.io/...

# Metrics Export (opcional)
METRICS_ENABLED=true
METRICS_PORT=9090
```

### Exemplo de Log Estruturado:

```json
{
  "level": 30,
  "time": 1695600000000,
  "pid": 12345,
  "hostname": "api-server",
  "reqId": "req-abc123",
  "req": {
    "method": "POST",
    "url": "/webhooks/whatsapp",
    "headers": {
      "content-type": "application/json"
    }
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 45,
  "msg": "request completed"
}
```

---

## 📊 Métricas Coletadas

### 1. Request Metrics
- `http_requests_total` - Total de requests
- `http_request_duration_ms` - Duração de requests
- `http_requests_error_total` - Total de erros

### 2. Database Metrics
- `db_queries_total` - Total de queries
- `db_query_duration_ms` - Duração de queries
- `db_connection_errors` - Erros de conexão

### 3. Worker Metrics
- `worker_jobs_total` - Total de jobs processados
- `worker_job_duration_ms` - Duração de jobs
- `worker_job_errors` - Total de erros em jobs

### 4. Business Metrics
- `orders_created_total` - Pedidos criados
- `payments_approved_total` - Pagamentos aprovados
- `generations_succeeded_total` - Gerações bem-sucedidas
- `generations_failed_total` - Gerações falhadas

### 5. Rate Limiting Metrics
- `rate_limit_blocked_total` - Total bloqueado por rate limit
- `rate_limit_remaining` - Quantidade restante por usuário

---

## 🔍 Request ID Tracking

### Como Funciona:

1. **Geração:** Middleware `request-id` gera UUID único para cada request
2. **Headers:** Adicionado ao header `X-Request-ID`
3. **Logs:** Todos os logs incluem `reqId`
4. **Propagação:** Passado para services, workers, e database calls

### Exemplo de Rastreamento:

```
[req-abc123] POST /webhooks/whatsapp
[req-abc123] WhatsAppWebhookHandler processing...
[req-abc123] UserService.findOrCreate: 5511999999999
[req-abc123] Database query: SELECT * FROM users WHERE...
[req-abc123] OrderService.create: Creating order for user-123
[req-abc123] Request completed in 45ms
```

---

## 🚨 Error Tracking

### Log de Erro Estruturado:

```json
{
  "level": 50,
  "time": 1695600000000,
  "reqId": "req-abc123",
  "err": {
    "type": "Error",
    "message": "ORDER_NOT_FOUND",
    "stack": "Error: ORDER_NOT_FOUND\n    at OrderService.findById..."
  },
  "context": {
    "orderId": "order-456",
    "userId": "user-123"
  },
  "msg": "Failed to process order"
}
```

### Integração com Sentry (Opcional):

```typescript
// apps/api/src/monitoring/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% das transactions
});

// Captura automática de erros não tratados
process.on("unhandledRejection", (reason) => {
  Sentry.captureException(reason);
});
```

---

## 📈 Performance Monitoring

### Response Time Tracking:

```typescript
// Exemplo em middleware
fastify.addHook("onRequest", async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook("onResponse", async (request, reply) => {
  const duration = Date.now() - request.startTime;
  request.log.info({ responseTime: duration }, "request completed");
});
```

### Slow Query Detection:

```typescript
// Wrapper para Prisma queries
async function queryWithLogging(query: () => Promise<any>, queryName: string) {
  const start = Date.now();
  try {
    const result = await query();
    const duration = Date.now() - start;
    
    if (duration > 1000) { // > 1s
      logger.warn({ queryName, duration }, "Slow query detected");
    }
    
    return result;
  } catch (error) {
    logger.error({ queryName, error }, "Query failed");
    throw error;
  }
}
```

---

## 🎯 Alerting (Preparação)

### Logs que Merecem Alertas:

1. **Erro Fatal:** `level: 60` (fatal)
2. **Erro Crítico:** `level: 50` (error) + contexto importante
3. **Slow Query:** `duration > 5000ms`
4. **Rate Limit Exceeded:** Taxa alta de bloqueios
5. **Worker Job Failed:** Job crítico falhou após retries

### Exemplo de Log para Alerta:

```json
{
  "level": 50,
  "alert": true,
  "severity": "high",
  "msg": "Payment processing failed after 3 retries",
  "context": {
    "orderId": "order-456",
    "paymentId": "payment-789",
    "amount": 500,
    "attempts": 3
  }
}
```

---

## 🔄 Log Aggregation

### Recomendações de Ferramentas:

#### 1. Railway/Render Built-in Logs
- ✅ Gratuito
- ✅ Search básica
- ❌ Retention curta (7-30 dias)
- ❌ Sem alerting

#### 2. Datadog (Recomendado para Produção)
- ✅ Log aggregation + APM
- ✅ Métricas e traces
- ✅ Alerting avançado
- ✅ Dashboards customizáveis
- 💰 ~$15-50/mês

#### 3. Sentry (Para Errors)
- ✅ Error tracking especializado
- ✅ Stack traces
- ✅ Release tracking
- ✅ Source maps
- 💰 Free tier + $26/mês (pro)

#### 4. Grafana + Loki (Self-hosted)
- ✅ Open source
- ✅ Customizável
- ❌ Requer setup e manutenção
- 💰 Custo de infra

---

## 📊 Dashboards Recomendados

### Dashboard 1: Sistema Overview
- Total de requests (últimas 24h)
- Taxa de erro (últimas 1h)
- Response time (p50, p95, p99)
- Database queries/s
- Worker jobs/s

### Dashboard 2: Business Metrics
- Pedidos criados (por hora)
- Taxa de conversão (pagamento/pedido)
- Gerações bem-sucedidas vs falhas
- Revenue (últimas 24h)

### Dashboard 3: Performance
- Slowest endpoints (top 10)
- Database slow queries
- Memory usage
- CPU usage

### Dashboard 4: Errors
- Erros por endpoint
- Erros por tipo
- Top error messages
- Error rate trend

---

## 🧪 Testando Monitoring

### 1. Testar Request ID:

```bash
curl -X GET https://seu-app.railway.app/health -v

# Resposta deve incluir:
# X-Request-ID: <uuid>
```

### 2. Testar Structured Logs:

```bash
# Ver logs na Railway/Render
# Procurar por linhas JSON com reqId
```

### 3. Testar Error Tracking:

```bash
# Forçar erro
curl -X GET https://seu-app.railway.app/orders/invalid-id

# Ver log de erro com stack trace
```

### 4. Testar Performance Tracking:

```bash
# Request normal
curl -X GET https://seu-app.railway.app/products

# Ver log com responseTime
```

---

## 🔒 Redaction de Dados Sensíveis

### Campos Automaticamente Redacted:

- `password`
- `passwordHash`
- `accessToken`
- `apiKey`
- `secret`
- `authorization`
- `pixCopyPaste` (parcial)
- `whatsappPhone` (parcial, ex: ****1234)

### Configuração (já implementada):

```typescript
// apps/api/src/config/logger.ts
const logger = pino({
  redact: {
    paths: [
      'password',
      'passwordHash',
      'accessToken',
      'apiKey',
      'secret',
      'authorization',
      'req.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
});
```

---

## 🚀 Próximos Passos (Opcional)

1. **Integrar Datadog:**
   - Instalar `dd-trace`
   - Configurar APM
   - Criar dashboards

2. **Integrar Sentry:**
   - Instalar `@sentry/node`
   - Configurar error tracking
   - Setup source maps para stack traces

3. **Custom Metrics:**
   - Implementar Prometheus exporter
   - Expor em `/metrics`
   - Scrape com Prometheus

4. **Distributed Tracing:**
   - Implementar OpenTelemetry
   - Rastrear fluxo completo (API → Worker → External API)
   - Visualizar em Jaeger/Zipkin

---

## 📝 Checklist de Monitoring

### Básico (Implementado):
- [x] Structured logging (Pino)
- [x] Request ID tracking
- [x] Performance metrics
- [x] Error logging
- [x] Health checks (/health, /ready)

### Intermediário (Preparado):
- [x] Log redaction
- [x] Slow query detection
- [x] Worker monitoring
- [ ] Sentry integration (código preparado)
- [ ] Datadog integration

### Avançado (Futuro):
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Custom metrics endpoint (/metrics)
- [ ] Real-time alerting
- [ ] Auto-scaling based on metrics

---

## 💰 Custos Estimados

| Ferramenta | Tier | Custo/Mês |
|-----------|------|-----------|
| Railway/Render Logs | Built-in | $0 |
| Sentry (Developer) | 10k events | $26 |
| Datadog (Pro) | 1 host | $31 |
| Grafana Cloud | Free | $0 |
| Total Básico | - | $0 |
| Total Recomendado | - | ~$57 |

---

**✅ FASE 12 - MONITORING COMPLETA**

Sistema está preparado para observabilidade avançada com structured logging, request tracking, performance metrics e error handling profissional.

Para implementação de Sentry/Datadog, consulte a documentação oficial de cada ferramenta.
