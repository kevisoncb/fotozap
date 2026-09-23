# Project Status

## Current Phase

FASE 0 concluída. FASE 1 em andamento (bootstrap do monólito modular).

## Completed

- Inspeção do ambiente Windows (máquina `ADM03`).
- Confirmação de diretório vazio em `C:\Users\ADM03\Desktop\fotozap`.
- Decisão de arquitetura: monólito modular em npm workspaces (API Fastify + worker no mesmo pacote, admin Next.js, Prisma no root).

## In Progress

- Bootstrap da Fase 1: toolchain local, TypeScript, lint, testes, Docker Compose, Prisma, seed, `.env.example`.

## Pending

- Fase 2: serviços de domínio (User, Product, Order, Payment, Generation, webhooks).
- Fase 3+: WhatsApp, imagem, Pix, filas, providers reais, admin funcional, hardening, deploy.

## Blocked

- **Docker Desktop / Docker Engine ausente.** PostgreSQL e Redis via Compose não podem subir nesta máquina até o Docker ser instalado.
- **Credenciais externas ausentes** (WhatsApp, Mercado Pago, provider de IA, Cloudflare R2). Não são necessárias para a Fase 1.
- **Git e Node não estavam no PATH do sistema.** Instalação portátil em `.tools/` (gitignored) para desenvolvimento nesta máquina; instalação de sistema ainda recomendada.

## Decisions

- Node.js **24.21.0 LTS (Krypton)** — versão LTS atual em https://nodejs.org/dist/index.json (campo `lts: "Krypton"`).
- Gerenciador: **npm workspaces** (vem com o Node; pnpm/yarn não estavam instalados).
- Prisma ORM **7.10.x** (estável), **não** Prisma 8 RC (`prisma@latest` no npm aponta para RC da plataforma Prisma).
- Fastify **5.x**, Next.js **16.x**.
- Provider de imagem e pagamentos: interfaces + mocks na Fase 1–6; reais nas Fases 7–8.
- Deploy de produção: decisão adiada para Fase 12 (candidatos: Railway / Render / Fly.io).

## Known Issues

- Shell do Cursor neste Windows não aplica sandbox de filesystem; comandos de terminal precisam de permissão `all`.
- WSL não está instalado.
- winget / Chocolatey / Scoop não estão disponíveis nesta sessão.
- Nenhuma variável de integração externa está definida no ambiente.

## Next Step

Concluir Fase 1 (estrutura, Prisma, testes unitários executáveis sem Docker) e, em seguida, Fase 2 (domínio).
