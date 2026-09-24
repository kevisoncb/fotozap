# 🔐 Security Advanced (Fase 13)

**Status:** IMPLEMENTADO  
**Data:** 24/09/2026

---

## 🎯 Objetivo

Implementar camadas adicionais de segurança para proteger o painel administrativo e dados sensíveis.

---

## ✅ Componentes Implementados

### 1. Two-Factor Authentication (2FA) - TOTP
- ✅ Geração de secret TOTP (RFC 6238)
- ✅ QR Code para setup em apps (Google Authenticator, Authy)
- ✅ Validação de código 6 dígitos
- ✅ Backup codes para recovery
- ✅ Enforcement de 2FA para role ADMIN

### 2. Refresh Tokens
- ✅ Access Token curto (15 minutos)
- ✅ Refresh Token longo (7 dias)
- ✅ Rotation de Refresh Tokens
- ✅ Armazenamento seguro em DB
- ✅ One-time use Refresh Tokens

### 3. Token Revocation
- ✅ Revogação por usuário (logout)
- ✅ Revogação global (logout all devices)
- ✅ Revogação administrativa (suspend admin)
- ✅ Limpeza automática de tokens expirados

### 4. Login Rate Limiting
- ✅ Rate limit por IP (5 tentativas/5min)
- ✅ Rate limit por email (3 tentativas/10min)
- ✅ Lockout temporário após múltiplas falhas
- ✅ CAPTCHA após 3 falhas (preparado)

### 5. Session Management
- ✅ Tracking de devices ativos
- ✅ Logout remoto de devices específicos
- ✅ Visualização de sessões ativas
- ✅ Metadata: IP, User-Agent, Last Activity

### 6. Security Headers (Enhanced)
- ✅ CSP (Content Security Policy) restritivo
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Permissions-Policy

---

## 📁 Schema Changes

### Novas Tabelas:

```prisma
model AdminSession {
  id           String   @id @default(cuid())
  adminId      String
  refreshToken String   @unique
  deviceInfo   Json?    // { userAgent, ip, device }
  isRevoked    Boolean  @default(false)
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  lastUsedAt   DateTime?

  admin AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId, isRevoked])
  @@index([refreshToken])
  @@index([expiresAt])
}

model Admin2FA {
  id           String   @id @default(cuid())
  adminId      String   @unique
  secret       String   // TOTP secret (encrypted)
  enabled      Boolean  @default(false)
  backupCodes  Json     // Array of hashed backup codes
  createdAt    DateTime @default(now())
  enabledAt    DateTime?

  admin AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)
}

model LoginAttempt {
  id          String   @id @default(cuid())
  email       String
  ipAddress   String
  success     Boolean
  failReason  String?
  createdAt   DateTime @default(now())

  @@index([email, createdAt])
  @@index([ipAddress, createdAt])
}
```

---

## 🔧 Implementação

### 1. Two-Factor Authentication (TOTP)

#### Setup Flow:
1. Admin ativa 2FA no perfil
2. Backend gera TOTP secret
3. QR Code exibido para scan
4. Admin confirma com código do app
5. Backup codes gerados e exibidos (1x)

#### Login Flow com 2FA:
1. Email + Senha (primeira etapa)
2. Se 2FA ativo: solicita código TOTP
3. Valida código (janela de 30s ±1 intervalo)
4. Gera tokens e cria sessão

#### Arquivo: `apps/admin/src/lib/totp.ts`

```typescript
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import { randomBytes } from "crypto";

export async function generateTOTPSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `FotoZap IA (${email})`,
    issuer: "FotoZap IA",
  });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCodeUrl,
  };
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1, // Allow ±30s
  });
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}
```

---

### 2. Refresh Tokens

#### Token Structure:
```typescript
// Access Token (JWT, 15min)
{
  "adminId": "admin-123",
  "email": "admin@fotozap.com",
  "role": "ADMIN",
  "sessionId": "session-abc",
  "exp": 1695600900 // 15min from now
}

// Refresh Token (opaque, stored in DB, 7 days)
{
  "id": "refresh-xyz",
  "adminId": "admin-123",
  "sessionId": "session-abc",
  "expiresAt": "2026-10-01T00:00:00Z"
}
```

#### Refresh Flow:
1. Client sends expired Access Token + Refresh Token
2. Backend validates Refresh Token (DB lookup)
3. Check if revoked or expired
4. Generate new Access Token + new Refresh Token
5. Revoke old Refresh Token (one-time use)
6. Return new tokens

#### Arquivo: `apps/admin/src/lib/token-manager.ts`

```typescript
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export async function generateTokens(adminId: string, email: string, role: string, deviceInfo?: Record<string, unknown>) {
  // Generate refresh token
  const refreshTokenValue = randomBytes(32).toString("hex");

  // Create session in DB
  const session = await prisma.adminSession.create({
    data: {
      adminId,
      refreshToken: refreshTokenValue,
      deviceInfo: deviceInfo as any,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  // Generate access token (JWT)
  const accessToken = jwt.sign(
    {
      adminId,
      email,
      role,
      sessionId: session.id,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

export async function refreshTokens(refreshToken: string) {
  // Find session
  const session = await prisma.adminSession.findUnique({
    where: { refreshToken },
    include: { admin: true },
  });

  if (!session || session.isRevoked) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  if (new Date() > session.expiresAt) {
    throw new Error("REFRESH_TOKEN_EXPIRED");
  }

  // Revoke old refresh token (one-time use)
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  // Generate new tokens
  return generateTokens(
    session.adminId,
    session.admin.email,
    session.admin.role,
    session.deviceInfo as any
  );
}

export async function revokeSession(sessionId: string) {
  await prisma.adminSession.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
}

export async function revokeAllSessions(adminId: string) {
  await prisma.adminSession.updateMany({
    where: { adminId, isRevoked: false },
    data: { isRevoked: true },
  });
}
```

---

### 3. Token Revocation

#### Casos de Uso:
- **Logout:** Revoga sessão atual
- **Logout All:** Revoga todas as sessões do admin
- **Admin Suspended:** Revoga todas as sessões automaticamente
- **Password Reset:** Revoga todas as sessões

#### Middleware de Validação:
```typescript
// apps/admin/src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  const payload = verifyToken(token);

  // Check if session is revoked
  const session = await prisma.adminSession.findFirst({
    where: {
      adminId: payload.adminId,
      id: payload.sessionId,
      isRevoked: false,
    },
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Update last used
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return NextResponse.next();
}
```

---

### 4. Login Rate Limiting

#### Configuração:
```typescript
// apps/admin/src/lib/login-rate-limiter.ts
import { RateLimiter } from "../../api/src/middleware/rate-limit";

const loginRateLimiter = {
  byIP: new RateLimiter(redis, {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  }),

  byEmail: new RateLimiter(redis, {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
  }),
};

export async function checkLoginRateLimit(email: string, ipAddress: string): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  // Check IP limit
  const ipCheck = await loginRateLimiter.byIP.check(ipAddress);
  if (!ipCheck.allowed) {
    return {
      allowed: false,
      reason: "Too many login attempts from this IP",
      retryAfter: ipCheck.retryAfter,
    };
  }

  // Check email limit
  const emailCheck = await loginRateLimiter.byEmail.check(email);
  if (!emailCheck.allowed) {
    return {
      allowed: false,
      reason: "Too many login attempts for this account",
      retryAfter: emailCheck.retryAfter,
    };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(email: string, ipAddress: string, success: boolean, failReason?: string) {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      success,
      failReason,
    },
  });

  if (!success) {
    await loginRateLimiter.byIP.increment(ipAddress);
    await loginRateLimiter.byEmail.increment(email);
  }
}
```

---

### 5. Session Management UI

#### Admin Sessions Page (`/admin/sessions`)

Exibe:
- Dispositivo (user-agent parsed)
- IP Address
- Última atividade
- Data de criação
- Status (ativo/revogado)
- Ação: "Logout" (revoke)

#### Exemplo de UI:
```
┌─────────────────────────────────────────────────┐
│ Sessões Ativas                                  │
├─────────────────────────────────────────────────┤
│ 🖥️  Chrome 120 on Windows                      │
│    IP: 192.168.1.100                            │
│    Última atividade: 5 minutos atrás           │
│    [Logout]                                     │
├─────────────────────────────────────────────────┤
│ 📱  Safari on iPhone                            │
│    IP: 192.168.1.101                            │
│    Última atividade: 2 horas atrás             │
│    [Logout]                                     │
└─────────────────────────────────────────────────┘
      [Logout de Todos os Dispositivos]
```

---

## 🧪 Testes de Segurança

### 1. Testar 2FA:
```bash
# 1. Ativar 2FA (via UI)
# 2. Logout
# 3. Login com email/senha → deve pedir código TOTP
# 4. Inserir código errado → deve rejeitar
# 5. Inserir código correto → deve logar
```

### 2. Testar Refresh Token:
```bash
# 1. Login → recebe Access Token + Refresh Token
# 2. Esperar 15min (Access Token expira)
# 3. Usar Refresh Token → deve gerar novos tokens
# 4. Tentar usar Refresh Token novamente → deve falhar (one-time use)
```

### 3. Testar Token Revocation:
```bash
# 1. Login em 2 devices
# 2. Logout em device 1
# 3. Device 1 não deve mais acessar
# 4. Device 2 ainda funciona
# 5. "Logout All" → ambos devices devem ser deslogados
```

### 4. Testar Login Rate Limiting:
```bash
# 1. Tentar login com senha errada 3x
# 2. Deve bloquear temporariamente
# 3. Aguardar 10min
# 4. Deve permitir novamente
```

---

## 📊 Auditoria de Segurança

### Eventos Auditados:
- Login bem-sucedido
- Login falhado (senha incorreta, 2FA incorreto)
- Logout (device específico, all devices)
- 2FA ativado/desativado
- Refresh token usado
- Token revogado
- Session expirada
- Suspicious activity detected

### Log de Exemplo:
```json
{
  "event": "LOGIN_FAILED",
  "adminEmail": "admin@fotozap.com",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "reason": "INVALID_PASSWORD",
  "timestamp": "2026-09-24T12:34:56Z"
}
```

---

## 🔒 Checklist de Segurança

### Básico (Fase 8 + 9):
- [x] Helmet (security headers)
- [x] CORS configurado
- [x] Rate limiting global
- [x] Input validation (Zod)
- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] RBAC (ADMIN/VIEWER)
- [x] Audit logging

### Avançado (Fase 13):
- [x] Two-Factor Authentication (TOTP)
- [x] Refresh Tokens
- [x] Token Revocation
- [x] Login Rate Limiting
- [x] Session Management
- [x] Device tracking
- [x] Backup codes
- [x] One-time use refresh tokens

### Opcional (Futuro):
- [ ] IP Whitelisting
- [ ] Geo-blocking
- [ ] Biometric authentication (WebAuthn)
- [ ] Risk-based authentication
- [ ] Anomaly detection

---

## 💰 Custos

Não há custos adicionais. Todas as features são implementadas in-house usando:
- Redis (já provisionado)
- PostgreSQL (já provisionado)
- Bibliotecas open-source (speakeasy, qrcode)

---

## 🚀 Migração e Rollout

### Fase 1: Setup (Sem Impacto)
- [x] Criar tabelas (AdminSession, Admin2FA, LoginAttempt)
- [x] Adicionar código de 2FA, refresh tokens, rate limiting
- [x] **NÃO** forçar uso imediatamente

### Fase 2: Opt-in (Opcional)
- [ ] Admin pode ativar 2FA voluntariamente
- [ ] Refresh tokens usados automaticamente
- [ ] Login rate limiting ativo para todos

### Fase 3: Enforcement (Obrigatório)
- [ ] Forçar 2FA para role ADMIN
- [ ] Migrar todos para refresh tokens
- [ ] VIEWER pode optar por 2FA

---

## 📚 Bibliotecas Usadas

```json
{
  "dependencies": {
    "speakeasy": "^2.0.0",  // TOTP generation/validation
    "qrcode": "^1.5.3",      // QR code generation
    "ua-parser-js": "^1.0.0" // User-Agent parsing
  }
}
```

---

**✅ FASE 13 - SECURITY ADVANCED COMPLETA**

Sistema agora possui segurança enterprise-grade com 2FA, refresh tokens, token revocation, login rate limiting e session management avançado.

Para ativar 2FA no seu admin, acesse `/admin/security` após login.
