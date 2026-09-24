# 🚀 Guia de Deploy em Produção - FotoZap IA

Status: **PRONTO PARA DEPLOY**

## 📋 Pré-requisitos

Antes de começar, você precisará:

- ✅ Conta no [Railway](https://railway.app) ou [Render](https://render.com)
- ✅ Repositório GitHub com o código do FotoZap
- ✅ Credenciais da Meta (WhatsApp Business API)
- ✅ Credenciais do Mercado Pago
- ✅ Credenciais da OpenAI
- ✅ Credenciais da Cloudflare R2

---

## 🎯 Opção A: Deploy na Railway (Recomendado)

### Passo 1: Preparar Repositório

1. **Faça push do código para o GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - FotoZap IA"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/fotozap.git
   git push -u origin main
   ```

### Passo 2: Criar Projeto na Railway

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório `fotozap`
5. Railway detectará automaticamente o `railway.json`

### Passo 3: Provisionar Banco de Dados PostgreSQL

1. No painel do projeto, clique em **"+ New"**
2. Selecione **"Database" → "PostgreSQL"**
3. Aguarde a criação (1-2 minutos)
4. Railway fornecerá automaticamente a variável `DATABASE_URL`

### Passo 4: Provisionar Redis

1. No painel do projeto, clique em **"+ New"**
2. Selecione **"Database" → "Redis"**
3. Aguarde a criação (1-2 minutos)
4. Railway fornecerá automaticamente a variável `REDIS_URL`

### Passo 5: Configurar Variáveis de Ambiente

No painel do projeto Railway, clique no serviço `fotozap` e vá em **"Variables"**. Configure:

#### ⚙️ Sistema Base
```bash
NODE_ENV=production
API_PORT=3001
ADMIN_PORT=3000
LOG_LEVEL=info
```

#### 🔐 Segurança
```bash
# Gere com: openssl rand -base64 32
JWT_SECRET=seu-jwt-secret-aqui-min-32-chars
```

#### 📦 Banco de Dados e Cache
```bash
# Fornecidos automaticamente pela Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

#### 💬 WhatsApp Business API (Meta)
```bash
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=seu_token_meta_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_VERIFY_TOKEN=token_verificacao_webhook
WHATSAPP_APP_SECRET=seu_app_secret_aqui
```

**Como obter:**
- Acesse [Meta Business Suite](https://business.facebook.com)
- Vá em "Ferramentas" → "WhatsApp Business API"
- Copie o `Access Token`, `Phone Number ID` e `App Secret`
- Defina um `Verify Token` (qualquer string secreta, ex: `webhook123`)

#### 💰 Mercado Pago
```bash
PAYMENT_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

**Como obter:**
- Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- Vá em "Credenciais de produção"
- Copie o `Access Token`
- Configure webhook em "Webhooks" e copie o `Secret`

#### 🎨 OpenAI (DALL-E 3)
```bash
IMAGE_PROVIDER=openai
OPENAI_API_KEY=sk-seu_api_key_aqui
```

**Como obter:**
- Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
- Crie uma nova API Key
- Copie e guarde com segurança

#### 🗄️ Cloudflare R2 (Storage)
```bash
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=seu_account_id_aqui
R2_ACCESS_KEY_ID=seu_access_key_aqui
R2_SECRET_ACCESS_KEY=seu_secret_access_key_aqui
R2_BUCKET=fotozap
R2_PUBLIC_URL=https://fotozap.seu-dominio.r2.dev
```

**Como obter:**
- Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
- Vá em "R2" → "Create bucket" → Nome: `fotozap`
- Vá em "Manage R2 API Tokens" → "Create API Token"
- Copie `Account ID`, `Access Key ID` e `Secret Access Key`
- Configure domínio público em "Settings" → "Public Access"

### Passo 6: Deploy Inicial

1. Railway fará o deploy automaticamente após configurar as variáveis
2. Aguarde o build e deploy (3-5 minutos)
3. Monitore os logs em tempo real clicando em **"Deployments"**

### Passo 7: Rodar Migrations e Seed

1. No painel Railway, clique em **"Settings" → "Deployments"**
2. Clique nos **três pontos** do deploy ativo → **"Run Command"**
3. Execute os comandos em ordem:

```bash
# 1. Rodar migrations
npm run db:migrate:deploy

# 2. Seed de produtos (produção)
npm run db:seed:production

# 3. Criar primeiro admin
npm run admin:create
```

> **Nota:** O `admin:create` é interativo. Use a interface da Railway para inserir email, senha e nome.

### Passo 8: Criar Serviços Adicionais

#### 🌐 Admin Panel (Next.js)

1. No painel do projeto, clique em **"+ New"**
2. Selecione **"GitHub Repo"** → Escolha `fotozap` novamente
3. Configure:
   - **Service Name:** `fotozap-admin`
   - **Start Command:** `npm run start:admin`
   - **Variables:** Copie as mesmas variáveis do serviço principal

#### ⚙️ Worker (BullMQ)

1. No painel do projeto, clique em **"+ New"**
2. Selecione **"GitHub Repo"** → Escolha `fotozap` novamente
3. Configure:
   - **Service Name:** `fotozap-worker`
   - **Start Command:** `npm run start:worker`
   - **Variables:** Copie `DATABASE_URL`, `REDIS_URL` e credenciais dos providers

### Passo 9: Configurar Webhooks Externos

#### 🔗 WhatsApp Webhook (Meta)

1. Acesse [Meta Business Suite](https://business.facebook.com)
2. Vá em "WhatsApp" → "Configuration" → "Webhooks"
3. Configure:
   - **Callback URL:** `https://seu-app.railway.app/webhooks/whatsapp`
   - **Verify Token:** O mesmo valor de `WHATSAPP_VERIFY_TOKEN`
   - **Webhook Fields:** Marque `messages` e `message_status`
4. Clique em **"Verify and Save"**

#### 💳 Mercado Pago Webhook

1. Acesse [Mercado Pago Webhooks](https://www.mercadopago.com.br/developers/panel/webhooks)
2. Clique em **"Criar Webhook"**
3. Configure:
   - **URL:** `https://seu-app.railway.app/webhooks/mercadopago`
   - **Events:** Marque `payment` e `merchant_order`
4. Copie o `Secret` gerado e atualize `MERCADOPAGO_WEBHOOK_SECRET`

### Passo 10: Verificar Deploy

✅ **Checklist de Verificação:**

1. **API Health Check:**
   ```bash
   curl https://seu-app.railway.app/health
   # Deve retornar: {"status":"ok","timestamp":"..."}
   ```

2. **Admin Panel:**
   - Acesse `https://seu-admin.railway.app`
   - Faça login com as credenciais criadas
   - Verifique Dashboard, Produtos, Pedidos

3. **Worker:**
   - Verifique logs em Railway → `fotozap-worker`
   - Deve aparecer: `🔨 Worker started`

4. **WhatsApp:**
   - Envie mensagem de teste para o número configurado
   - Deve receber resposta com menu de produtos

---

## 🎯 Opção B: Deploy no Render

### Passo 1: Preparar Repositório

(Mesmo procedimento da Railway - Passo 1)

### Passo 2: Criar Projeto no Render

1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em **"New +"** → **"Blueprint"**
3. Conecte o repositório `fotozap`
4. Render detectará automaticamente o `render.yaml`
5. Clique em **"Apply"**

### Passo 3: Configurar Variáveis de Ambiente

Render criará automaticamente os 3 serviços e os 2 bancos de dados. Configure as variáveis em cada serviço:

#### 📦 Serviço: fotozap-api

Vá em **"Environment"** e adicione as mesmas variáveis da Railway (Passo 5), exceto:

```bash
# Render fornece automaticamente
DATABASE_URL=internal
REDIS_URL=internal
```

#### 📦 Serviço: fotozap-admin

(Mesmas variáveis do `fotozap-api`, incluindo `JWT_SECRET`)

#### 📦 Serviço: fotozap-worker

(Mesmas variáveis do `fotozap-api`, exceto `JWT_SECRET`)

### Passo 4: Deploy Inicial

1. Render fará deploy automaticamente após aplicar o Blueprint
2. Aguarde o build dos 3 serviços (5-10 minutos)
3. Monitore os logs em tempo real

### Passo 5: Rodar Migrations e Seed

1. Acesse **"fotozap-api"** → **"Shell"**
2. Execute:

```bash
npm run db:migrate:deploy
npm run db:seed:production
npm run admin:create
```

### Passo 6: Configurar Webhooks

(Mesmo procedimento da Railway - Passo 9)

Use as URLs dos serviços Render:
- **WhatsApp:** `https://fotozap-api.onrender.com/webhooks/whatsapp`
- **Mercado Pago:** `https://fotozap-api.onrender.com/webhooks/mercadopago`

---

## 📊 Monitoramento Pós-Deploy

### 1. Logs em Tempo Real

**Railway:**
```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Ver logs
railway logs
```

**Render:**
- Acesse o serviço no dashboard
- Clique em **"Logs"**

### 2. Métricas Importantes

Monitore:
- ✅ Taxa de sucesso de webhooks (WhatsApp + Mercado Pago)
- ✅ Taxa de sucesso de gerações de IA (OpenAI)
- ✅ Tempo de resposta das APIs
- ✅ Uso de créditos (OpenAI, Cloudflare R2)
- ✅ Taxa de erro de pagamentos

### 3. Testes Críticos Pós-Deploy

Execute estes fluxos manualmente:

#### 🧪 Teste 1: Fluxo WhatsApp Completo
1. Envie mensagem para o número WhatsApp
2. Receba menu de produtos
3. Responda `1` (escolher produto)
4. Envie uma foto
5. Receba QR Code Pix
6. Pague com Pix
7. Receba imagem gerada

#### 🧪 Teste 2: Admin Panel
1. Acesse o painel admin
2. Faça login
3. Edite um produto
4. Verifique logs de auditoria
5. Crie um novo admin com role VIEWER

#### 🧪 Teste 3: Rate Limiting
1. Envie múltiplas mensagens rapidamente
2. Deve receber mensagem de rate limit após N tentativas

---

## 🔧 Troubleshooting

### Erro: "PrismaClient requires a driver adapter"

**Causa:** Prisma 7.x requer adapter explícito

**Solução:** Já configurado em `apps/api/src/lib/prisma.ts` e `apps/admin/src/lib/prisma.ts`

### Erro: "EADDRINUSE: address already in use"

**Causa:** Porta já ocupada

**Solução:** Railway/Render usam porta dinâmica via `process.env.PORT`

Verifique em `apps/api/src/server.ts`:
```typescript
const PORT = process.env.PORT || process.env.API_PORT || 3001;
```

### Erro: "Missing required environment variable: XXX"

**Causa:** Variável não configurada

**Solução:** Revise o Passo 5 e configure todas as variáveis obrigatórias

### Webhooks não recebem eventos

**Causa:** URL incorreta ou verificação falhou

**Solução:**
1. Verifique se a URL está acessível: `curl https://seu-app.railway.app/health`
2. Verifique logs do serviço
3. Re-configure o webhook na Meta/Mercado Pago

### Imagens não são geradas

**Causa:** OpenAI API Key inválida ou sem créditos

**Solução:**
1. Verifique se a API Key está correta
2. Verifique saldo em [OpenAI Usage](https://platform.openai.com/usage)
3. Verifique logs do worker

### Worker não processa jobs

**Causa:** Redis não conectado ou Worker não iniciado

**Solução:**
1. Verifique se `REDIS_URL` está configurado
2. Verifique logs do serviço `fotozap-worker`
3. Teste conexão Redis:
   ```bash
   redis-cli -u $REDIS_URL ping
   # Deve retornar: PONG
   ```

---

## 🔒 Checklist de Segurança

Antes de ir para produção:

- [ ] `JWT_SECRET` tem pelo menos 32 caracteres aleatórios
- [ ] `WHATSAPP_APP_SECRET` está configurado
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` está configurado
- [ ] CORS está configurado para domínios permitidos
- [ ] Rate limiting está ativo (verificar em `/docs/security-phase8.md`)
- [ ] Todos os webhooks usam HTTPS
- [ ] Primeiro admin foi criado com senha forte
- [ ] Backup do banco de dados está configurado (Railway/Render)

---

## 💰 Estimativa de Custos Mensais

### Railway (Starter Plan)
- **API Service:** $5/mês
- **Admin Service:** $5/mês
- **Worker Service:** $5/mês
- **PostgreSQL:** $5/mês
- **Redis:** $5/mês
- **Total:** ~$25/mês

### Render (Starter Plan)
- **API Service:** $7/mês
- **Admin Service:** $7/mês
- **Worker Service:** $7/mês
- **PostgreSQL:** $7/mês
- **Redis:** $10/mês
- **Total:** ~$38/mês

### Custos Externos (Variáveis)
- **OpenAI (DALL-E 3):** $0.040 por imagem (1024x1024) → ~$4/100 imagens
- **Cloudflare R2:** $0.015/GB de armazenamento + $0.36/milhão de requests → ~$2-5/mês
- **Mercado Pago:** 2.99% + R$0.99 por transação Pix → Grátis para receber
- **WhatsApp Business API:** Grátis até 1.000 conversas/mês

**Total Estimado Inicial:** $30-50/mês + custos de uso

---

## 🚀 Próximos Passos (Pós-Deploy)

1. **Configurar Domínio Customizado:**
   - Compre domínio em [Namecheap](https://www.namecheap.com) ou [Registro.br](https://registro.br)
   - Configure DNS apontando para Railway/Render
   - Ative HTTPS automático

2. **Configurar Backup Automático:**
   - Railway/Render fazem backup automático do PostgreSQL
   - Configure backup adicional via [pgBackups](https://devcenter.heroku.com/articles/heroku-postgres-backups)

3. **Configurar Monitoramento:**
   - [Sentry](https://sentry.io) para tracking de erros
   - [Datadog](https://www.datadoghq.com) para métricas de performance
   - [UptimeRobot](https://uptimerobot.com) para monitoramento de uptime

4. **Configurar CI/CD:**
   - Railway/Render fazem deploy automático a cada push no `main`
   - Configure branch de staging para testes

---

## 📞 Suporte

- **Railway:** [railway.app/help](https://railway.app/help)
- **Render:** [render.com/docs](https://render.com/docs)
- **FotoZap Issues:** [GitHub Issues](https://github.com/SEU_USUARIO/fotozap/issues)

---

**✅ SISTEMA PRONTO PARA PRODUÇÃO**

Última atualização: Fase 11 - Deploy
