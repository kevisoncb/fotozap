# 🎨 FotoZap IA

**Plataforma de Geração de Imagens com IA via WhatsApp**

Sistema completo de criação e edição de imagens com Inteligência Artificial, integrado ao WhatsApp Business API, processamento de pagamentos PIX e entrega automatizada.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-24.21.0%20LTS-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-119%2B%20passing-brightgreen.svg)](./apps/api/tests)

---

## 🚀 Features

### Core
- ✅ **WhatsApp Business Integration** - Interação completa via WhatsApp
- ✅ **Pagamento PIX** - Integração Mercado Pago com QR Code
- ✅ **Geração de Imagens IA** - OpenAI DALL-E 3
- ✅ **Storage em Nuvem** - Cloudflare R2
- ✅ **Workers Assíncronos** - BullMQ para processamento em background

### Segurança
- ✅ **Autenticação JWT** com bcrypt
- ✅ **Two-Factor Authentication (2FA)** - TOTP
- ✅ **Refresh Tokens** com rotação
- ✅ **Rate Limiting** - Proteção financeira e anti-abuse
- ✅ **RBAC** - Roles (ADMIN/VIEWER)
- ✅ **Audit Logging** - Rastreamento completo

### Observabilidade
- ✅ **Structured Logging** - Pino
- ✅ **Request ID Tracking** - Correlação de logs
- ✅ **Performance Metrics** - HTTP, DB, Workers
- ✅ **Health Checks** - /health e /ready
- ✅ **Error Tracking** - Preparado para Sentry

### Qualidade
- ✅ **119+ Testes** - 84 unit + 35 E2E
- ✅ **100% TypeScript** - Type-safe
- ✅ **Idempotency** - Webhooks e retries seguros
- ✅ **State Machine** - Redis-based conversation flow

---

## 🏗️ Arquitetura

### Modular Monolith
```
┌─────────────────────────────────────────┐
│           Usuário (WhatsApp)            │
└──────────────┬──────────────────────────┘
               │
         ┌─────▼─────┐
         │  Fastify  │ ◄─── Webhooks (Meta + MP)
         │    API    │
         └─────┬─────┘
               │
    ┏━━━━━━━━━┻━━━━━━━━━┓
    ┃   Domain Services   ┃
    ┃  User │ Order │ Pay ┃
    ┗━━━━━━━━━┳━━━━━━━━━┛
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼───┐  ┌──▼───┐
│Postgres│  │Redis │  │BullMQ│
│  DB    │  │Cache │  │Worker│
└────────┘  └──────┘  └──┬───┘
                         │
              ┌──────────┼──────────┐
              │          │          │
          ┌───▼──┐   ┌──▼──┐   ┌──▼──┐
          │OpenAI│   │ R2  │   │ MP  │
          │DALL-E│   │Store│   │ PIX │
          └──────┘   └─────┘   └─────┘
```

### Stack
- **Backend:** Node.js 24 LTS, Fastify 5, TypeScript 5.9
- **Database:** PostgreSQL 16 + Prisma 7
- **Cache:** Redis 7
- **Queue:** BullMQ 6
- **Admin:** Next.js 16, React 19, Tailwind CSS 4
- **Testing:** Vitest 3

---

## 📦 Estrutura do Projeto

```
fotozap/
├── apps/
│   ├── api/                    # Backend Fastify
│   │   ├── src/
│   │   │   ├── modules/        # Domain modules
│   │   │   ├── providers/      # External integrations
│   │   │   ├── workers/        # BullMQ workers
│   │   │   ├── middleware/     # Request handling
│   │   │   └── monitoring/     # Observability
│   │   └── tests/
│   │       ├── unit/           # 84 unit tests
│   │       └── e2e/            # 35 E2E tests
│   └── admin/                  # Admin Panel Next.js
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── components/     # React components
│       │   └── lib/            # Auth, utils
│       └── tests/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # All migrations
│   └── seed*.ts                # Seed scripts
├── docs/                       # Documentação (~5.700 linhas)
│   ├── deploy-production.md
│   ├── quick-deploy-mock.md
│   ├── monitoring-phase12.md
│   ├── security-advanced-phase13.md
│   └── ...
├── scripts/
│   └── create-first-admin.ts
├── railway.json                # Railway config
├── Procfile                    # Render/Heroku config
├── render.yaml                 # Render Blueprint
└── package.json                # Monorepo root
```

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 24.21.0+ LTS
- PostgreSQL 16+
- Redis 7+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/kevisoncb/fotozap.git
cd fotozap

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Rodar migrations
npm run db:migrate:deploy

# Seed inicial (produtos)
npm run db:seed:production

# Criar primeiro admin
npm run admin:create
```

### Desenvolvimento

```bash
# Terminal 1: API
npm run dev

# Terminal 2: Admin Panel
npm run dev:admin

# Terminal 3: Worker
npm run dev:worker

# Terminal 4: Testes (watch mode)
npm run test
```

### Produção

```bash
# Build completo
npm run build

# Start services
npm run start:api      # API (porta 3001)
npm run start:admin    # Admin (porta 3000)
npm run start:worker   # Worker (background)
```

---

## 🔐 Variáveis de Ambiente

### Essenciais
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fotozap

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-min-32-chars

# Providers (mock ou real)
WHATSAPP_PROVIDER=mock
PAYMENT_PROVIDER=mock
IMAGE_PROVIDER=mock
STORAGE_PROVIDER=mock
```

### Produção (Real)
```bash
# WhatsApp Business (Meta)
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_secret

# Mercado Pago
PAYMENT_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=your_token
MERCADOPAGO_WEBHOOK_SECRET=your_secret

# OpenAI
IMAGE_PROVIDER=openai
OPENAI_API_KEY=sk-your-key

# Cloudflare R2
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your_account
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET=fotozap
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

Ver lista completa em: [`.env.example`](.env.example)

---

## 🧪 Testes

### Unit Tests (84)
```bash
npm run test
```

### E2E Tests (35)
```bash
npm run test:e2e
```

### Coverage
- Domain Services: 100%
- Webhook Handlers: 95%
- Workers: 90%

---

## 📖 Documentação

### Guias de Deploy
- [**Deploy Produção**](docs/deploy-production.md) - Railway/Render (~400 linhas)
- [**Deploy Mock**](docs/quick-deploy-mock.md) - Teste rápido (~400 linhas)

### Segurança
- [**Security Phase 8**](docs/security.md) - Rate Limiting + Hardening
- [**Security Phase 9**](docs/security-advanced.md) - RBAC + Audit
- [**Security Phase 13**](docs/security-advanced-phase13.md) - 2FA + Tokens (~700 linhas)

### Monitoring
- [**Monitoring Phase 12**](docs/monitoring-phase12.md) - Observability (~600 linhas)

### Troubleshooting
- [**Build Fixes**](docs/BUILD_FIXES.md) - Correções TypeScript (~900 linhas)
- [**Error Explanation**](docs/ERROR_EXPLANATION.md) - Detalhes de erros (~1000 linhas)

### Testes
- [**E2E Testing**](docs/testing-e2e.md) - Guia completo (~600 linhas)

**Total:** 10 documentos, ~5.700 linhas de documentação

---

## 🚢 Deploy

### Railway (Recomendado)
```bash
# 1. Conecte GitHub no Railway
# 2. Provisione PostgreSQL + Redis
# 3. Configure variáveis de ambiente
# 4. Deploy automático

# Ver guia completo:
docs/deploy-production.md
```

### Render
```bash
# 1. Use render.yaml blueprint
# 2. Configure env vars
# 3. Deploy

# Ver guia completo:
docs/deploy-production.md
```

### Custos Estimados
- **Hospedagem:** $25-38/mês (Railway/Render)
- **OpenAI:** $0.04/imagem
- **Cloudflare R2:** $2-5/mês
- **Mercado Pago:** 2.99% + R$0.99/transação
- **WhatsApp:** Grátis até 1.000 conversas/mês

**Total:** ~$30-50/mês + custos variáveis de uso

---

## 🔄 Fluxo de Usuário

1. **Usuário** envia "oi" no WhatsApp
2. **Bot** responde com menu de produtos
3. **Usuário** escolhe produto (ex: "1 - Foto Retro")
4. **Bot** solicita foto
5. **Usuário** envia foto
6. **Sistema** gera QR Code PIX (R$ 5-7)
7. **Usuário** paga via PIX
8. **Webhook** confirma pagamento
9. **Worker** processa geração com OpenAI DALL-E 3
10. **Sistema** envia imagem gerada via WhatsApp
11. **Pedido** completo!

Tempo médio: 2-5 minutos

---

## 🛡️ Segurança

### Implementado
- ✅ bcrypt (password hashing)
- ✅ JWT (authentication)
- ✅ 2FA/TOTP (two-factor)
- ✅ Refresh Tokens (rotation)
- ✅ Rate Limiting (abuse prevention)
- ✅ CORS (cross-origin)
- ✅ Helmet (security headers)
- ✅ Input Validation (Zod)
- ✅ Webhook Signature Validation
- ✅ Audit Logging

### Recomendações
- Use HTTPS em produção
- Troque `JWT_SECRET` regularmente
- Monitore logs de segurança
- Ative 2FA para todos ADMINs
- Configure backup do banco

---

## 📊 Status do Projeto

### Fases Completas
- ✅ Fase 0: Inspeção
- ✅ Fase 1: Bootstrap
- ✅ Fase 2: Domain Services
- ✅ Fase 3: WhatsApp Integration
- ✅ Fase 4: Storage & Upload
- ✅ Fase 5: Payment & Image Providers
- ✅ Fase 6: BullMQ Workers
- ✅ Fase 7: Admin Panel
- ✅ Fase 8: Security & Hardening
- ✅ Fase 9: Security Advanced (RBAC)
- ✅ Fase 10: E2E Testing
- ✅ Fase 11: Deploy Preparation
- ✅ Fase 12: Monitoring
- ✅ Fase 13: Security Advanced (2FA)

### Métricas
- **Linhas de Código:** ~15.000+ (TypeScript)
- **Testes:** 119+ (100% passando)
- **Documentação:** ~5.700 linhas
- **Arquivos:** 200+ (sem node_modules)
- **Coverage:** ~95%

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Padrão de Commits
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Atualização de documentação
- `refactor:` - Refatoração de código
- `test:` - Adição/modificação de testes
- `chore:` - Tarefas de manutenção

---

## 📝 License

Este projeto está sob a licença MIT. Ver [LICENSE](LICENSE) para mais informações.

---

## 👨‍💻 Autor

**Kevison** - [GitHub](https://github.com/kevisoncb)

---

## 🙏 Agradecimentos

- OpenAI (DALL-E 3)
- Meta (WhatsApp Business API)
- Mercado Pago (Payment Gateway)
- Cloudflare (R2 Storage)
- Prisma (ORM)
- Fastify (Framework)
- Next.js (Admin Panel)

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/kevisoncb/fotozap/issues)
- **Documentação:** [/docs](./docs)
- **Email:** [seu@email.com]

---

**✅ Sistema 100% Production-Ready**

Desenvolvido com ❤️ usando TypeScript, Node.js e boas práticas de engenharia de software.
