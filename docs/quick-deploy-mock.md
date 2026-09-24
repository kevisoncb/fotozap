# 🎯 Quick Deploy com Mock Providers

**Objetivo:** Deploy em minutos para testar UI e fluxos básicos sem integrações externas.

---

## ✅ Quando Usar Este Guia

Use este método se você quer:
- ✅ Subir o sistema **rapidamente** (30-60 minutos)
- ✅ Testar **UI e navegação** do Admin Panel
- ✅ Validar **fluxos básicos** sem API keys externas
- ✅ Fazer **demo** sem custos de APIs pagas
- ❌ **NÃO** funciona para: WhatsApp real, pagamentos PIX reais, imagens AI reais

---

## 📦 Pré-requisitos

1. Conta Railway ou Render (gratuita)
2. Código no GitHub
3. 30-60 minutos de tempo

---

## 🏗️ Opção A: Deploy na Railway (Recomendado)

### Passo 1: Conectar Repositório

1. Acesse [railway.app](https://railway.app)
2. Login com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Selecione `fotozap`

### Passo 2: Provisionar Bancos de Dados

#### PostgreSQL:
1. No projeto, clique **+ New**
2. Selecione **Database → PostgreSQL**
3. Aguarde criação (1-2min)
4. Railway fornece `DATABASE_URL` automaticamente

#### Redis:
1. No projeto, clique **+ New**
2. Selecione **Database → Redis**
3. Aguarde criação (1-2min)
4. Railway fornece `REDIS_URL` automaticamente

### Passo 3: Configurar Variáveis de Ambiente (Mock Mode)

No painel do projeto Railway, clique no serviço `fotozap` → **Variables**:

```bash
# Sistema
NODE_ENV=production
API_PORT=3001
ADMIN_PORT=3000
LOG_LEVEL=info

# Banco de Dados (fornecidos automaticamente)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Segurança (gere com: openssl rand -base64 32)
JWT_SECRET=change-me-in-production-min-32-chars-jwt-secret

# 🎭 MODO MOCK - Sem APIs Externas
WHATSAPP_PROVIDER=mock
PAYMENT_PROVIDER=mock
IMAGE_PROVIDER=mock
STORAGE_PROVIDER=mock

# WhatsApp Mock (valores fictícios, não validados)
WHATSAPP_ACCESS_TOKEN=mock_token
WHATSAPP_PHONE_NUMBER_ID=mock_phone_id
WHATSAPP_VERIFY_TOKEN=mock_verify
WHATSAPP_APP_SECRET=mock_secret

# Payment Mock (não cria cobranças reais)
MERCADOPAGO_ACCESS_TOKEN=mock_mp_token
MERCADOPAGO_WEBHOOK_SECRET=mock_mp_secret

# Image Mock (retorna URLs de imagens de exemplo)
OPENAI_API_KEY=mock_openai_key

# Storage Mock (armazena em memória, temporário)
R2_ACCOUNT_ID=mock_account
R2_ACCESS_KEY_ID=mock_key
R2_SECRET_ACCESS_KEY=mock_secret
R2_BUCKET=mock_bucket
R2_PUBLIC_URL=https://mock.example.com

# Rate Limiting (opcionais, use defaults)
MAX_MESSAGES_PER_MINUTE=20
MAX_UPLOADS_PER_HOUR=15
MAX_GENERATIONS_PER_HOUR=10
MAX_ORDERS_PER_HOUR=10
```

### Passo 4: Deploy Inicial

1. Railway faz deploy automaticamente
2. Monitore em **Deployments** (3-5min)
3. Aguarde status **Success**

### Passo 5: Rodar Migrations e Seed

1. No deploy ativo, clique **⋮** (três pontos) → **Run Command**
2. Execute em ordem:

```bash
# 1. Migrations
npm run db:migrate:deploy

# 2. Seed de produtos
npm run db:seed:production

# 3. Criar primeiro admin (email: admin@fotozap.com, senha: Admin@123)
npm run admin:create
```

> **Nota:** O comando `admin:create` é interativo. Use:
> - **Email:** `admin@fotozap.com`
> - **Senha:** `Admin@123` (use senha forte em produção!)
> - **Nome:** `Admin Desenvolvimento`

### Passo 6: Criar Serviços Adicionais

#### 🌐 Admin Panel (Next.js)

1. **+ New** → **GitHub Repo** → Escolha `fotozap`
2. Configure:
   - **Service Name:** `fotozap-admin`
   - **Start Command:** `npm run start:admin`
   - **Variables:** Copie as mesmas variáveis do serviço principal

#### ⚙️ Worker (BullMQ)

1. **+ New** → **GitHub Repo** → Escolha `fotozap`
2. Configure:
   - **Service Name:** `fotozap-worker`
   - **Start Command:** `npm run start:worker`
   - **Variables:** Copie `DATABASE_URL`, `REDIS_URL` e providers mock

### Passo 7: Verificar Deploy

1. **API Health:**
   ```bash
   curl https://seu-app.railway.app/health
   # Deve retornar: {"status":"ok","timestamp":"..."}
   ```

2. **Admin Panel:**
   - Acesse `https://seu-admin.railway.app`
   - Login: `admin@fotozap.com` / `Admin@123`
   - Navegue Dashboard, Produtos, Pedidos

3. **Worker:**
   - Verifique logs: `fotozap-worker` → **Logs**
   - Deve aparecer: `🔨 Worker started`

---

## 🏗️ Opção B: Deploy no Render

### Passo 1: Conectar Repositório

1. Acesse [render.com](https://render.com)
2. Login com GitHub
3. **New +** → **Blueprint**
4. Conecte `fotozap`
5. Render detecta `render.yaml` automaticamente
6. **Apply**

### Passo 2: Configurar Variáveis (igual Railway)

Render cria 3 services + 2 databases automaticamente.

Para cada service, adicione as mesmas variáveis de ambiente do Railway (Passo 3 acima).

**Diferença:** Render fornece `DATABASE_URL` e `REDIS_URL` internamente.

### Passo 3: Rodar Migrations

1. Acesse **fotozap-api** → **Shell**
2. Execute:
   ```bash
   npm run db:migrate:deploy
   npm run db:seed:production
   npm run admin:create
   ```

### Passo 4: Verificar (igual Railway Passo 7)

---

## 🎭 Como os Mock Providers Funcionam

### MockWhatsAppProvider
- ✅ Simula envio de mensagens (console.log)
- ✅ Simula download de mídia (retorna buffer fictício)
- ✅ **Não** envia mensagens reais no WhatsApp
- ✅ **Não** requer tokens Meta

### MockPaymentProvider
- ✅ Gera PIX fake (QR Code Base64 fictício)
- ✅ Auto-aprova pagamentos após 5 segundos
- ✅ **Não** cria cobranças reais no Mercado Pago
- ✅ **Não** requer tokens Mercado Pago

### MockImageProvider
- ✅ Retorna URLs de imagens de exemplo
- ✅ Delay de 500ms para simular processamento
- ✅ **Não** chama OpenAI DALL-E
- ✅ **Não** consome créditos OpenAI
- ✅ **Não** requer API Key OpenAI

### MockObjectStorage
- ✅ Armazena arquivos em memória (Map)
- ✅ **Não** persiste após restart
- ✅ **Não** usa Cloudflare R2
- ✅ **Não** requer credenciais R2

---

## 🔧 Testando o Sistema

### 1. Teste UI Admin Panel

✅ **Login:**
- Acesse admin panel
- Email: `admin@fotozap.com`
- Senha: `Admin@123`

✅ **Dashboard:**
- Verifica métricas (devem estar zeradas inicialmente)

✅ **Produtos:**
- Verifica 4 produtos criados no seed
- Testa toggle ativar/desativar
- Testa edição de preço e prompt

✅ **Pedidos:**
- Lista vazia inicialmente
- Após criar pedidos, verifica exibição

✅ **Admins (se for ADMIN):**
- Cria novo admin VIEWER
- Testa toggle role
- Testa toggle status

✅ **Audit Logs (se for ADMIN):**
- Verifica logs de ações administrativas

### 2. Teste API via curl

```bash
# Health check
curl https://seu-app.railway.app/health

# Webhook WhatsApp (simulação)
curl -X POST https://seu-app.railway.app/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"field":"messages","value":{"messages":[{"from":"5511999999999","id":"msg123","text":{"body":"oi"},"timestamp":"1234567890","type":"text"}]}}]}]}'
```

### 3. Teste Worker

Verifique logs do worker:
- `fotozap-worker` deve estar rodando
- Logs devem mostrar conexão com Redis
- Não haverá jobs processados até criar orders

---

## ⚠️ Limitações do Mock Mode

| Recurso | Mock Mode | Modo Real |
|---------|-----------|-----------|
| WhatsApp messages | ❌ Não envia | ✅ Envia real |
| Pagamento PIX | ❌ Fake QR Code | ✅ Cobrança real |
| Imagens AI | ❌ URLs exemplo | ✅ DALL-E 3 real |
| Storage | ❌ Memória (temporário) | ✅ R2 (persistente) |
| Webhooks | ❌ Simulado | ✅ Real |
| Custos | ✅ $0 | 💰 Variável |

---

## 🔄 Migrando para Modo Real

Quando quiser ativar as integrações reais:

1. **Obtenha as credenciais:**
   - Meta WhatsApp Business API
   - Mercado Pago
   - OpenAI
   - Cloudflare R2

2. **Atualize variáveis no Railway/Render:**
   ```bash
   # Mudar de mock para real
   WHATSAPP_PROVIDER=meta
   PAYMENT_PROVIDER=mercadopago
   IMAGE_PROVIDER=openai
   STORAGE_PROVIDER=r2

   # Adicionar credenciais reais
   WHATSAPP_ACCESS_TOKEN=seu_token_real
   WHATSAPP_PHONE_NUMBER_ID=seu_id_real
   # ... e assim por diante
   ```

3. **Redeploy:**
   - Railway: Automatic redeploy
   - Render: Manual redeploy no dashboard

4. **Configurar webhooks externos:**
   - Meta: `https://seu-app.railway.app/webhooks/whatsapp`
   - Mercado Pago: `https://seu-app.railway.app/webhooks/mercadopago`

---

## 💰 Custos Estimados (Mock Mode)

### Railway:
- API Service: $5/mês
- Admin Service: $5/mês
- Worker Service: $5/mês
- PostgreSQL: $5/mês
- Redis: $5/mês
- **Total: $25/mês**

### Render:
- API Service: $7/mês
- Admin Service: $7/mês
- Worker Service: $7/mês
- PostgreSQL: $7/mês
- Redis: $10/mês
- **Total: $38/mês**

### Custos de APIs Externas (Mock Mode):
- ✅ **$0** - Sem consumo de APIs pagas

---

## 🎉 Próximos Passos

Após deploy com mock:

1. ✅ **Testar UI e fluxos básicos**
2. ✅ **Validar navegação do Admin Panel**
3. ✅ **Fazer demo para stakeholders**
4. 🔄 **Migrar para modo real** quando necessário
5. 🔒 **Ativar Security Hardening** (Fase 13)
6. 📊 **Implementar Monitoring** (Fase 12)

---

## 🆘 Troubleshooting

### Erro: "Missing database URL"
**Solução:** Verifique se `DATABASE_URL` está configurado e o PostgreSQL está rodando.

### Erro: "Redis connection failed"
**Solução:** Verifique se `REDIS_URL` está configurado e o Redis está rodando.

### Admin Panel não carrega
**Solução:** 
1. Verifique se `JWT_SECRET` está configurado
2. Verifique se o admin foi criado (`npm run admin:create`)
3. Verifique logs do serviço `fotozap-admin`

### Worker não processa jobs
**Solução:**
1. Verifique logs do `fotozap-worker`
2. Confirme que `REDIS_URL` está acessível
3. Teste conexão Redis: `redis-cli -u $REDIS_URL ping`

---

**✅ SISTEMA RODANDO EM MODO MOCK - DEPLOY RÁPIDO COMPLETO!**

Para deploy com integrações reais, consulte `docs/deploy-production.md`.
