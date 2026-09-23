# Technical decisions

## 2026-09-23 — Node 24.21.0 LTS

Fonte: `https://nodejs.org/dist/index.json`, `lts: "Krypton"` na versão `v24.21.0`.

## 2026-09-23 — npm workspaces

pnpm/yarn não estavam instalados. npm 11.19.0 acompanha o Node LTS.

## 2026-09-23 — Prisma ORM 7.10.0, não Prisma 8 RC

`prisma@latest` no npm aponta para `8.0.0-rc.x` (CLI da plataforma). O ORM estável usado aqui é `prisma@7.10.0` + `@prisma/client@7.10.0` + `@prisma/adapter-pg`, conforme docs de upgrade v7 (adapter obrigatório, `prisma-client` generator, `prisma.config.ts`).

## 2026-09-23 — Fastify 5.12.x e Next.js 16.3.x

Versões `latest` oficiais no npm no momento do bootstrap.

## 2026-09-23 — Dinheiro em centavos inteiros

Evita float em Pix/pedidos.

## 2026-09-23 — Estados extras de pedido

Além do conjunto pedido no spec, existem `GENERATION_COMPLETED` e `DELIVERY_PENDING` para não marcar pedido como perdido quando a IA concluiu e o WhatsApp falhou.

## 2026-09-23 — Toolchain portátil em `.tools/`

Node/Git não estavam no PATH. Download oficial com SHA-256 conferido. Pasta gitignored. Não substitui instalação de sistema nem Docker.
