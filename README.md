# FotoZap IA

Sistema de geração de imagens com IA integrado ao WhatsApp, com painel administrativo e processamento de pagamentos via Pix.

## Arquitetura

**Monorepo TypeScript (ESM) + PostgreSQL + Redis**

```
fotozap/
├── apps/
│   ├── api/          # Fastify + Prisma + BullMQ Workers
│   └── admin/        # Next.js 16 (App Router)
├── packages/
│   └── shared/       # Tipos e utilitários compartilhados
└── prisma/           # Schema e migrations
```

### Stack Técnico

- **API**: Fastify 5, Prisma 7, BullMQ, Pino (logging estruturado)
- **Admin**: Next.js 16 (Turbopack), Server Actions, TailwindCSS
- **Database**: PostgreSQL (Prisma ORM)
- **Cache/Queue**: Redis + ioredis
- **Storage**: Cloudflare R2 (S3-compatible)
- **Pagamento**: Mercado Pago (Pix)
- **IA**: OpenAI DALL-E 3
- **WhatsApp**: Meta Business API

## Variáveis de Ambiente

### Obrigatórias (Produção)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# API
PORT=3001
ADMIN_SESSION_SECRET=secret-min-32-chars

# WhatsApp (Meta Business API)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

# Pagamento (Mercado Pago)
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=

# IA (OpenAI)
OPENAI_API_KEY=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

### Opcionais (Desenvolvimento)

```bash
WHATSAPP_PROVIDER=mock    # mock | real (default: real)
PAYMENT_PROVIDER=mock     # mock | real (default: real)
IMAGE_PROVIDER=mock       # mock | real (default: real)
STORAGE_PROVIDER=mock     # mock | real (default: real)
```

## Desenvolvimento Local

### Pré-requisitos

- Node.js ≥24.10.0
- PostgreSQL 15+
- Redis 7+

### Setup

```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npm run db:generate

# 3. Rodar migrations
npm run db:migrate

# 4. Seed do banco (produtos + admin padrão)
npm run db:seed

# 5. Iniciar serviços
npm run dev              # API (porta 3001)
npm run dev:admin        # Admin (porta 3000)
npm run dev:worker       # BullMQ Worker
```

### Criar Primeiro Admin

```bash
npm run admin:create
# Email: admin@fotozap.com
# Senha: (informe no prompt)
```

## Comandos Essenciais

```bash
# Build
npm run build            # Compila tudo (shared → api → admin)
npm run build:api        # Apenas API
npm run build:admin      # Apenas Admin

# Testes
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests

# Database
npm run db:generate      # Regenera Prisma Client
npm run db:migrate       # Aplica migrations (dev)
npm run db:migrate:deploy # Aplica migrations (prod)
npm run db:seed          # Seed desenvolvimento
npm run db:seed:production # Seed produção

# Linting
npm run lint             # ESLint
npm run typecheck        # TypeScript check (monorepo)
```

## Deploy (Railway / Render)

### Build Process

Railway detecta automaticamente via `Procfile` e `railway.json`:

```
1. npm ci
2. npm run db:generate
3. npm run build:shared
4. npm run build (workspaces)
```

### Start Commands

```
api:    npm run start:api     # Fastify (PORT=3001)
admin:  npm run start:admin   # Next.js (PORT=3000)
worker: npm run start:worker  # BullMQ Worker
```

### Pós-Deploy

```bash
# 1. Migrations (via Railway CLI ou shell)
npm run db:migrate:deploy

# 2. Seed produção
npm run db:seed:production

# 3. Criar admin
npm run admin:create
```

## Estrutura de Serviços

### API (Fastify)

- **Webhooks**: `/whatsapp`, `/mercadopago`
- **Health**: `/health`, `/ready`
- **Admin Auth**: Sessões JWT com refresh tokens

### Workers (BullMQ)

- `generation-queue`: Processa gerações de imagem (DALL-E)
- `cleanup-queue`: Remove arquivos temporários
- `expiration-queue`: Cancela pedidos expirados

### Admin Panel

- Gestão de produtos, pedidos, usuários
- Dashboard com métricas
- Auditoria de ações administrativas
- Autenticação com 2FA (TOTP)

## Segurança

- Rate limiting (Redis): WhatsApp, Admin, Webhooks
- Validação rigorosa (Zod) em todos os endpoints
- Headers de segurança (Helmet)
- Idempotência em webhooks (SHA-256 hash)
- CORS configurado
- Senhas com bcrypt (salt rounds: 12)
- Sessões JWT com rotação de tokens

## Monitoramento

- Logs estruturados (Pino + JSON)
- Request IDs para tracing
- Métricas de performance (histogramas)
- Health checks (DB + Redis)

## Licença

Proprietário - FotoZap IA © 2026
