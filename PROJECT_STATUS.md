# Project Status

## Current Phase

**FASE 4 CONCLUÍDA**. Pronto para FASE 5 (Pagamento Pix + Mercado Pago).

## Completed

### Fase 0 — Inspeção
- ✅ Inspeção do ambiente Windows (máquina `ADM03`)
- ✅ Node.js 24.21.0 LTS + MinGit 2.55.0.5 instalados em `.tools/` (portátil)
- ✅ Confirmação de arquitetura: monólito modular npm workspaces

### Fase 1 — Bootstrap
- ✅ Monorepo configurado (`apps/api`, `apps/admin`, `packages/shared`)
- ✅ Prisma 7.10 schema completo (11 tabelas, enums, indexes)
- ✅ Fastify API com health/ready routes
- ✅ Next.js 16 admin skeleton (6 rotas placeholder)
- ✅ TypeScript project references + ESLint + Prettier + Vitest
- ✅ **8 testes unitários passando** (domínio: money, order transitions, generation status, prompt interpolation)
- ✅ **Lint passando**
- ✅ **Typecheck passando** (com workarounds de generated Prisma client)
- ✅ Docker Compose (PostgreSQL 16 + Redis 7)
- ✅ `.env.example` com todas as variáveis
- ✅ Interfaces de provider (WhatsApp, Payment, Image, Storage)
- ✅ Documentação (`docs/` com 11 arquivos MD)
- ✅ Git inicializado, 2 commits

### Fase 2 — Domain Services
- ✅ **UserService** (findOrCreate, markDeleted, lastInteractionAt)
- ✅ **ProductService** (listActive, findBySlug)
- ✅ **OrderService** (create, transitionStatus com validação, findExpired)
- ✅ **PaymentService** (create, markApproved idempotente, findByExternalId)
- ✅ **GenerationService** (create anti-duplicação, updateStatus com proteção out-of-order)
- ✅ **WebhookService** (recordEvent deduplicação, markProcessed)
- ✅ **MessageService** (create idempotente por externalId)
- ✅ **26 testes unitários passando** (7 suites)
- ✅ Todas as transições de estado validadas
- ✅ Proteção contra webhooks duplicados
- ✅ Proteção contra gerações simultâneas no mesmo pedido
- ✅ Lint passando (0 erros)

### Fase 3 — WhatsApp Integration
- ✅ **GET/POST /webhooks/whatsapp** (verificação Meta + eventos)
- ✅ **WhatsAppCloudProvider** (sendText, sendImage, sendDocument, downloadMedia)
- ✅ **MockWhatsAppProvider** (desenvolvimento sem tokens)
- ✅ **ConversationService** (Redis state machine com TTL)
- ✅ **BotService** (menu, comandos, seleção de produto)
- ✅ **WhatsAppWebhookHandler** (signature validation, async processing)
- ✅ Estados: IDLE, SELECTING_PRODUCT, WAITING_FOR_IMAGE
- ✅ Comandos: MENU, OI, CANCELAR, AJUDA, 1-4
- ✅ Integrado no server.ts (ativo quando DATABASE_URL + REDIS_URL presentes)
- ✅ **38 testes passando** (9 suites, +12 novos testes)
- ✅ Idempotência por externalMessageId
- ✅ Documentação atualizada

### Fase 4 — Storage & Image Upload
- ✅ **IObjectStorage** interface (putObject, getObjectUrl, deleteObject, objectExists)
- ✅ **MockObjectStorage** (Map em memória para desenvolvimento)
- ✅ **R2ObjectStorage** (Cloudflare R2 via @aws-sdk/client-s3)
- ✅ **Factory pattern** (STORAGE_PROVIDER=mock|r2)
- ✅ **ImageService** (validação: tamanho, mime, bytes; upload; delete)
- ✅ **WhatsAppImageHandler** (download → validação → upload → vincula Order → atualiza estado)
- ✅ Validação de imagem: MAX_IMAGE_SIZE_MB, mime types (jpeg/png/webp), tamanho mínimo
- ✅ Path de storage: `users/{userId}/input/{uuid}.ext` e `users/{userId}/output/{uuid}.ext`
- ✅ BotService cria Order draft na seleção de produto
- ✅ Estado `IMAGE_RECEIVED` adicionado ao fluxo
- ✅ Server.ts integra storage provider e ImageHandler
- ✅ **49 testes passando** (11 suites, +11 novos testes)
- ✅ Documentação atualizada (`docs/storage.md`)

## In Progress

Nada. Aguardando início da Fase 5.

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
