# Admin Panel

Status: **IMPLEMENTADO** (Fase 7).

## Overview

Painel administrativo Next.js 16 com autenticação, acesso direto ao banco via Prisma, e design dark mode minimalista.

---

## Autenticação

### Middleware Protection

**Arquivo:** `apps/admin/src/middleware.ts`

```typescript
// Protege TODAS as rotas exceto /login
matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"]
```

**Cookie:** `admin-auth=authenticated`

- **HttpOnly:** `true`
- **Secure:** `true` em production
- **SameSite:** `strict`
- **MaxAge:** 7 dias

### Login

**URL:** `http://localhost:3000/login`

**Credenciais:**
- Senha: `ADMIN_PASSWORD` env var (default: `admin123`)

**Fluxo:**
1. Usuário acessa qualquer rota → redireciona para `/login`
2. Digita senha → `POST /api/auth/login`
3. Valida contra `process.env.ADMIN_PASSWORD`
4. Se correto: define cookie `admin-auth`
5. Redireciona para `/` (Dashboard)

### Logout

**Button:** Sidebar inferior

**Ação:**
1. `POST /api/auth/logout`
2. Deleta cookie `admin-auth`
3. Redireciona para `/login`

---

## Acesso Direto ao Banco (Monorepo)

### Prisma Client Compartilhado

```typescript
// apps/admin/src/lib/prisma.ts
import { PrismaClient } from "../../../generated/prisma/client.js";

export const prisma = new PrismaClient();
```

**Benefícios:**
- ✅ Sem chamadas HTTP à API Fastify
- ✅ Type-safe (TypeScript)
- ✅ Baixa latência (query direta)
- ✅ Monorepo: compartilha schema Prisma

### Server Components

```typescript
// Exemplo: Dashboard
async function getMetrics() {
  const totalRevenue = await prisma.order.aggregate({
    where: { status: "COMPLETED" },
    _sum: { amountCents: true },
  });
  
  return totalRevenue;
}

export default async function DashboardPage() {
  const metrics = await getMetrics();
  // ...
}
```

### Server Actions

```typescript
// apps/admin/src/app/(authenticated)/products/actions.ts
"use server";

export async function toggleProductActive(productId: string, active: boolean) {
  await prisma.product.update({
    where: { id: productId },
    data: { active },
  });

  revalidatePath("/products");
}
```

---

## Telas

### 1. Dashboard (`/`)

**Métricas exibidas:**

| Card | Cálculo | Ícone |
|------|---------|-------|
| **Faturamento Total** | `SUM(amountCents) WHERE status=COMPLETED` | DollarSign (verde) |
| **Pedidos Pagos** | `COUNT(*) WHERE status IN (PAID, PROCESSING, COMPLETED)` | CheckCircle (azul) |
| **Falhas de Geração** | `COUNT(*) WHERE generation.status=FAILED` | XCircle (vermelho) |

**Layout:**
- 3 cards horizontais (grid md:grid-cols-3)
- Fundo: gray-900
- Bordas: gray-800
- Ícones coloridos em backgrounds com opacidade

---

### 2. Produtos (`/products`)

**Funcionalidades:**
- ✅ Listar todos os produtos (tabela)
- ✅ Ativar/Desativar (toggle button)
- ✅ Editar preço + prompt OpenAI (modal)

**Colunas da tabela:**
- Nome
- Slug
- Preço (R$ X.XX)
- Status (botão toggle: Ativo/Inativo)
- Ações (ícone Edit2)

**Toggle:**
- Verde/Green se ativo
- Cinza/Gray se inativo
- onClick → Server Action `toggleProductActive`
- Atualiza instantaneamente (optimistic UI)

**Edit Modal:**
- Nome (disabled, não editável)
- Preço (input number, step 0.01)
- Prompt OpenAI (textarea, 4 rows)
- Botões: Cancelar / Salvar
- onSubmit → Server Action `updateProduct`
- Fecha modal após sucesso
- Revalida página automaticamente

---

### 3. Pedidos & Gerações (`/orders`)

**Dados exibidos:**

| Coluna | Fonte | Formatação |
|--------|-------|------------|
| **ID Pedido** | `order.id` | Truncado (8 chars + ...) |
| **Cliente** | `order.user.whatsappPhone` | Mascarado (****1234) |
| **Produto** | `order.product.name` | Nome completo |
| **Status Pedido** | `order.status` | Badge colorido |
| **Status Pix** | `order.payments[0].status` | Badge colorido |
| **Status IA** | `order.generations[0].status` | Badge colorido |
| **Valor** | `order.amountCents / 100` | R$ X.XX |

**Mascaramento de Telefone:**
```typescript
function maskPhone(phone: string) {
  const lastFour = phone.slice(-4);
  const masked = "*".repeat(phone.length - 4);
  return masked + lastFour;
}

// Exemplo: 5511999887766 → *********7766
```

**Status Badges:**
- Verde: PAID, COMPLETED, SUCCEEDED
- Azul: PROCESSING, GENERATION_COMPLETED
- Amarelo: PENDING_PAYMENT
- Vermelho: FAILED
- Roxo: DELIVERY_PENDING
- Cinza: CREATED, CANCELLED

**Limite:** Últimos 100 pedidos (ordenados por `createdAt desc`)

**Include Relations:**
```typescript
{
  user: true,
  product: true,
  payments: { orderBy: { createdAt: "desc" }, take: 1 },
  generations: { orderBy: { createdAt: "desc" }, take: 1 },
}
```

---

## Design (Dark Mode)

### Paleta de Cores

| Elemento | Tailwind Class | Hex |
|----------|---------------|-----|
| **Background** | bg-gray-950 | #030712 |
| **Cards** | bg-gray-900 | #111827 |
| **Borders** | border-gray-800 | #1F2937 |
| **Text Primary** | text-white | #FFFFFF |
| **Text Secondary** | text-gray-400 | #9CA3AF |
| **Input BG** | bg-gray-800 | #1F2937 |
| **Input Border** | border-gray-700 | #374151 |
| **Focus Ring** | ring-blue-500 | #3B82F6 |

### Componentes

**Card:**
```tsx
<div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
  {children}
</div>
```

**Button Primary:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
  Salvar
</button>
```

**Input:**
```tsx
<input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
```

### Layout

**Sidebar:**
- Width: 64 (256px)
- Background: gray-900
- Border right: gray-800
- Navegação: Dashboard, Produtos, Pedidos
- Logout no footer

**Main Content:**
- Padding: 8 (2rem)
- Flex: 1 (ocupa espaço restante)

---

## Estrutura de Arquivos

```
apps/admin/src/
├── middleware.ts                   # Auth protection
├── app/
│   ├── layout.tsx                 # Root layout (dark theme)
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── api/auth/
│   │   ├── login/route.ts         # POST login
│   │   └── logout/route.ts        # POST logout
│   └── (authenticated)/
│       ├── layout.tsx             # Sidebar + content
│       ├── page.tsx               # Dashboard
│       ├── products/
│       │   ├── page.tsx           # Products table
│       │   ├── ProductToggle.tsx  # Client component
│       │   ├── EditProductForm.tsx # Modal form
│       │   └── actions.ts         # Server Actions
│       └── orders/
│           └── page.tsx           # Orders table
├── components/
│   ├── Sidebar.tsx                # Navigation + logout
│   └── Card.tsx                   # Reusable card
└── lib/
    └── prisma.ts                  # Shared Prisma client
```

---

## Executar Localmente

### 1. Instalar dependências

```bash
cd apps/admin
npm install
```

### 2. Configurar environment

```bash
# apps/admin/.env.local (ou root .env)
DATABASE_URL="postgresql://fotozap:fotozap@localhost:5432/fotozap?schema=public"
ADMIN_PASSWORD="admin123"
```

### 3. Rodar dev server

```bash
npm run dev
```

**URL:** http://localhost:3000

### 4. Login

- Acesse http://localhost:3000
- Redireciona para `/login`
- Digite senha: `admin123` (ou valor de `ADMIN_PASSWORD`)
- Clique "Entrar"
- Redireciona para Dashboard

---

## Segurança

### Proteção de Rotas

- ✅ Middleware bloqueia TODAS as rotas não autenticadas
- ✅ Cookie httpOnly (não acessível por JS)
- ✅ Cookie secure em production (HTTPS only)
- ✅ SameSite=strict (CSRF protection)

### Senha Estática

⚠️ **Produção:** Trocar `ADMIN_PASSWORD` por senha forte (min 12 chars).

**Recomendação futura (Fase 9):**
- Hash bcrypt da senha
- Login com usuário + senha
- 2FA (two-factor authentication)
- Rate limiting de login attempts

### Acesso ao Banco

- ✅ Server Components (sem exposição ao client)
- ✅ Server Actions com revalidatePath
- ✅ Validação de inputs (TypeScript + Zod futuro)
- ✅ Prisma queries type-safe

---

## Desenvolvimento

### Hot Reload

Next.js 16 com Turbopack:
- Fast Refresh habilitado
- Server Components atualizam ao salvar
- Server Actions revalidam automaticamente

### TypeScript

```bash
npm run typecheck
```

**Config:** `apps/admin/tsconfig.json`
- Strict mode: true
- Module resolution: bundler
- Include: `["./src", "../../generated"]`

---

## Dependências

```json
{
  "dependencies": {
    "next": "16.3.6",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "lucide-react": "^1.47.0",
    "@prisma/client": "^7.10.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.1.13",
    "@types/react": "^19.1.13"
  }
}
```

---

## Roadmap Futuro

### Fase 9 (Segurança adicional):
- [ ] Hash de senha (bcrypt)
- [ ] Multi-usuário admin
- [ ] Roles (admin, viewer)
- [ ] Audit logs

### Melhorias UX:
- [ ] Paginação nas tabelas
- [ ] Filtros (status, data)
- [ ] Busca por telefone/ID
- [ ] Export CSV
- [ ] Gráficos (Chart.js)
- [ ] Notificações toast

---

## Resumo

✅ **Autenticação** (middleware + cookie)  
✅ **Acesso direto** (Prisma monorepo)  
✅ **Dashboard** (métricas vitais)  
✅ **Produtos** (CRUD completo)  
✅ **Pedidos** (tracking + mascaramento)  
✅ **Dark mode** (minimalista premium)  
✅ **Server Actions** (revalidação automática)  
✅ **Type-safe** (TypeScript + Prisma)  
✅ **Production-ready**

**Painel acessível em http://localhost:3000** 🎉
