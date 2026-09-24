# 🌐 Cloud Deployment Fixes

**Status:** ✅ COMPLETO  
**Commit:** `infra/cloud-fixes`  
**Data:** 2026-09-24

## 🎯 Problema Identificado

Após deploy na Railway, os serviços retornavam:
- ❌ Erro 404
- ❌ "The train has not arrived at the station"

**Causas Raiz:**
1. **Port Binding:** API não estava respeitando `process.env.PORT` (padrão Railway)
2. **Graceful Degradation:** Sistema crashava com valores provisórios como `aguardando_meta`
3. **Service Orchestration:** Faltava clareza sobre como rodar múltiplos serviços do monorepo

---

## ✅ Correções Aplicadas

### 1. Fix Fastify Host & Port ✅

**Arquivo:** `apps/api/src/config/env.ts`

**Problema:**
- `API_PORT` usava apenas `3001` como default
- Railway/Render usam `process.env.PORT`

**Solução:**
```typescript
await app.listen({
  host: "0.0.0.0",
  port: Number(process.env.PORT ?? env.API_PORT),
});
```

**Resultado:**
- ✅ API escuta em `0.0.0.0:${PORT}` automaticamente
- ✅ Compatível com Railway, Render, Heroku

---

### 2. Graceful Degradation (Providers) ✅

**Arquivo:** `apps/api/src/server.ts`

**Problema:**
- Sistema crashava quando variáveis continham `aguardando_meta`
- Erro fatal ao tentar criar provider real com tokens inválidos

**Solução:**
Implementada detecção automática de tokens inválidos/provisórios para todos os providers:

#### WhatsApp Provider
```typescript
const hasValidWhatsAppTokens = 
  env.WHATSAPP_ACCESS_TOKEN && 
  env.WHATSAPP_PHONE_NUMBER_ID && 
  !env.WHATSAPP_ACCESS_TOKEN.includes("aguardando") &&
  !env.WHATSAPP_PHONE_NUMBER_ID.includes("aguardando");

const whatsappProviderMode = (env.WHATSAPP_PROVIDER === "real" && hasValidWhatsAppTokens) 
  ? "real" 
  : "mock";
```

#### Payment Provider (Mercado Pago)
```typescript
const hasValidMercadoPagoToken = 
  env.MERCADOPAGO_ACCESS_TOKEN && 
  !env.MERCADOPAGO_ACCESS_TOKEN.includes("aguardando");
```

#### Storage Provider (Cloudflare R2)
```typescript
const hasValidR2Credentials = 
  env.R2_ACCOUNT_ID && 
  env.R2_ACCESS_KEY_ID && 
  env.R2_SECRET_ACCESS_KEY &&
  !env.R2_ACCOUNT_ID.includes("aguardando");
```

#### Image Provider (OpenAI)
```typescript
const hasValidOpenAIKey = 
  env.OPENAI_API_KEY && 
  !env.OPENAI_API_KEY.includes("aguardando");
```

**Resultado:**
- ✅ Sistema SEMPRE inicia, mesmo com tokens inválidos
- ✅ Fallback automático para modo mock
- ✅ Logs de warning claros quando usa fallback
- ✅ Permite deploy incremental (configurar integrações depois)

**Log de Exemplo:**
```
WARN: WhatsApp provider set to 'real' but tokens are invalid/missing. Using mock provider.
WARN: Payment provider set to 'real' but token is invalid/missing. Using mock provider.
```

---

### 3. Service Orchestration (Procfile) ✅

**Arquivo:** `Procfile` (raiz do projeto)

**Problema:**
- Monorepo com 3 serviços (API, Admin, Worker)
- Faltava clareza sobre como rodar cada serviço separadamente

**Solução:**
Procfile atualizado com instruções claras:

```procfile
# Procfile for Railway/Render/Heroku deployment
# 
# IMPORTANTE: Em plataformas de monorepo como Railway/Render,
# você deve criar SERVIÇOS SEPARADOS apontando para este mesmo repo,
# mas com comandos de start diferentes em cada serviço:
#
# Service 1 (API):        npm run start:api
# Service 2 (Admin):      npm run start:admin  
# Service 3 (Worker):     npm run start:worker
#
# Este Procfile é usado por padrão para o serviço principal (API).

web: npm run start:api
```

**Resultado:**
- ✅ Railway/Render entendem automaticamente o serviço principal
- ✅ Instruções claras para criar serviços adicionais
- ✅ Um repo → múltiplos serviços (arquitetura correta)

---

### 4. Next.js Admin Port Fix ✅

**Arquivo:** `apps/admin/package.json`

**Problema:**
- Admin tinha `--port 3000` hardcoded
- Não respeitava `process.env.PORT`

**Solução:**
```json
"start": "next start -p ${PORT:-3000}"
```

**Resultado:**
- ✅ Admin respeita `PORT` da plataforma cloud
- ✅ Fallback para 3000 em desenvolvimento

---

## 🚀 Como Testar na Railway

### Passo 1: Rebuild API
```bash
# Na Railway, force rebuild do serviço API
```

### Passo 2: Verificar Logs
Procure pelos seguintes logs de sucesso:
```
✅ "System fully initialized"
✅ "Server listening on 0.0.0.0:XXXX"
⚠️  (Opcional) "Using mock provider" warnings
```

### Passo 3: Testar Endpoints
```bash
# Health check
curl https://seu-dominio.railway.app/health

# Webhook WhatsApp (retorna 200 ou 403)
curl https://seu-dominio.railway.app/webhooks/whatsapp

# Admin (deve carregar)
https://seu-dominio-admin.railway.app
```

---

## 📦 Estrutura de Deploy Railway

```
┌─────────────────────────────────────┐
│  Projeto: fotozap                   │
├─────────────────────────────────────┤
│  Service 1: fotozap-api             │
│  - Start: npm run start:api         │
│  - Port: $PORT (auto)               │
│  - DB: PostgreSQL                   │
│  - Cache: Redis                     │
├─────────────────────────────────────┤
│  Service 2: fotozap-admin           │
│  - Start: npm run start:admin       │
│  - Port: $PORT (auto)               │
│  - DB: PostgreSQL (compartilhado)   │
├─────────────────────────────────────┤
│  Service 3: fotozap-worker          │
│  - Start: npm run start:worker      │
│  - No port binding (worker)         │
│  - DB: PostgreSQL (compartilhado)   │
│  - Cache: Redis (compartilhado)     │
└─────────────────────────────────────┘
```

---

## 🔐 Variáveis de Ambiente Essenciais

### Obrigatórias (Sistema Funcional)
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NODE_ENV=production
JWT_SECRET=<gerado pela plataforma>
```

### Opcionais (Podem usar mock)
```bash
# WhatsApp
WHATSAPP_PROVIDER=mock
WHATSAPP_ACCESS_TOKEN=aguardando_meta
WHATSAPP_PHONE_NUMBER_ID=aguardando_meta
WHATSAPP_VERIFY_TOKEN=qualquer_string
WHATSAPP_APP_SECRET=qualquer_string

# Mercado Pago
PAYMENT_PROVIDER=mock
MERCADOPAGO_ACCESS_TOKEN=aguardando  # (ou token real)
MERCADOPAGO_WEBHOOK_SECRET=<real>

# OpenAI
IMAGE_PROVIDER=mock
OPENAI_API_KEY=aguardando

# Cloudflare R2
STORAGE_PROVIDER=mock
R2_ACCOUNT_ID=aguardando
R2_ACCESS_KEY_ID=aguardando
R2_SECRET_ACCESS_KEY=aguardando
R2_BUCKET=aguardando
R2_PUBLIC_URL=aguardando
```

---

## ✅ Checklist de Deploy

- [x] API escuta em `0.0.0.0:${PORT}`
- [x] Sistema inicia com tokens provisórios
- [x] Procfile define serviço principal
- [x] Admin respeita `PORT` do ambiente
- [x] Logs de warning para providers mock
- [x] Graceful degradation completo
- [x] Documentação atualizada

---

## 🎯 Próximos Passos (Pós-Deploy)

1. **Configurar WhatsApp Real:**
   - Obter tokens da Meta Business
   - Atualizar variáveis: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
   - Mudar `WHATSAPP_PROVIDER=real`
   - Restart do serviço

2. **Configurar Storage Real (R2):**
   - Criar bucket no Cloudflare
   - Obter credenciais
   - Atualizar variáveis R2
   - Mudar `STORAGE_PROVIDER=r2`

3. **Configurar OpenAI Real:**
   - Obter API Key
   - Atualizar `OPENAI_API_KEY`
   - Mudar `IMAGE_PROVIDER=openai`

4. **Monitoramento:**
   - Acompanhar logs via Railway Dashboard
   - Verificar métricas de performance
   - Configurar alertas (se necessário)

---

## 📝 Notas Técnicas

### Por que `0.0.0.0`?
- Railway/Render usam containers
- Containers só aceitam binding em `0.0.0.0` (todas as interfaces)
- `localhost`/`127.0.0.1` são bloqueados por segurança

### Por que Graceful Degradation?
- Permite deploy incremental
- Não bloqueia desenvolvimento por falta de credenciais
- Sistema sempre funcional (mock ou real)
- Facilita testes e debugging

### Por que Múltiplos Serviços?
- API e Worker precisam rodar 24/7
- Admin pode escalar independentemente
- Separação de responsabilidades
- Melhor controle de recursos

---

**🚀 Status Final:** Sistema PRONTO para deploy na Railway com qualquer combinação de providers (mock ou real).
