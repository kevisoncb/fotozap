# FotoZap IA

Plataforma de criação/edição de imagens por IA, com experiência principal no WhatsApp.

Este repositório é um **monólito modular** (npm workspaces):

- `apps/api` — Fastify (webhooks, admin API, health)
- `apps/api` worker — processo separado (`npm run dev:worker`)
- `apps/admin` — Next.js (painel privado; esqueleto na Fase 1)
- `packages/shared` — tipos, transições de estado, dinheiro em centavos
- `prisma/` — fonte de verdade do modelo PostgreSQL

## Integrações (status atual)

| Integração | Status |
| --- | --- |
| WhatsApp Cloud API | MOCK (pendente Fase 3/131) |
| Mercado Pago Pix | MOCK (pendente Fase 5/8) |
| Image provider | MOCK (pendente Fase 4/7) |
| Cloudflare R2 | MOCK (pendente Fase 4) |
| PostgreSQL / Redis | definidos no Compose; **Docker não estava instalado nesta máquina** |

## Pré-requisitos

- Node.js 24 LTS
- Git
- Docker Desktop (PostgreSQL 16 + Redis 7)

Nesta máquina de bootstrap o Node/Git foram baixados de forma **portátil** em `.tools/` (não versionado). Docker continua como bloqueio externo.

## Setup

```powershell
copy .env.example .env
docker compose up -d
npm install
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Health:

- `GET http://localhost:3001/health` — processo vivo
- `GET http://localhost:3001/ready` — Postgres/Redis quando configurados

## Scripts

| Script | Função |
| --- | --- |
| `npm run dev` | API Fastify |
| `npm run dev:worker` | worker separado |
| `npm run dev:admin` | painel Next.js |
| `npm run test` | testes unitários |
| `npm run typecheck` | TypeScript (shared + api) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | migrations Prisma (precisa Postgres) |

Documentação em `docs/`. Status em `PROJECT_STATUS.md`.
