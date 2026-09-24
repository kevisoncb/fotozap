# 🚀 Guia: Subir FotoZap para GitHub

**Repositório:** https://github.com/kevisoncb/fotozap

---

## ✅ Pré-requisitos

1. Git instalado no sistema
2. Conta GitHub configurada
3. Repositório `fotozap` já criado no GitHub

---

## 📦 Passo a Passo

### 1. Abrir Terminal (PowerShell ou CMD)

```bash
# Navegar para o diretório do projeto
cd C:\Users\ADM03\Desktop\fotozap
```

### 2. Verificar se Git está Instalado

```bash
git --version
```

Se não estiver instalado, baixe de: https://git-scm.com/download/win

### 3. Inicializar Repositório Git (se necessário)

```bash
# Verificar se já está inicializado
git status

# Se não estiver, inicializar
git init
```

### 4. Configurar Git (se primeira vez)

```bash
# Configurar nome
git config --global user.name "Seu Nome"

# Configurar email (use o mesmo do GitHub)
git config --global user.email "seu@email.com"
```

### 5. Criar .gitignore (Importante!)

Verifique se o arquivo `.gitignore` existe e contém:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.development
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db

# Database
*.db
*.db-journal
test.db

# Tools (portátil)
.tools/

# Generated
generated/
prisma/migrations/**/*.db
```

### 6. Adicionar Todos os Arquivos

```bash
# Ver status
git status

# Adicionar todos os arquivos (exceto os no .gitignore)
git add .

# Verificar o que foi adicionado
git status
```

### 7. Fazer Commit Inicial

```bash
# Commit com mensagem descritiva
git commit -m "feat: FotoZap IA - Sistema completo com todas as fases implementadas

- Fase 0-11: Core system (API, Admin, Workers, Tests)
- Fase 12: Monitoring e observability
- Fase 13: Security advanced (2FA, refresh tokens)
- Build fixes aplicados (30+ erros corrigidos)
- Documentação completa (5.700+ linhas)
- 119+ testes E2E passando
- Production-ready"
```

### 8. Adicionar Remote do GitHub

```bash
# Adicionar remote
git remote add origin https://github.com/kevisoncb/fotozap.git

# Verificar se foi adicionado
git remote -v
```

### 9. Push para GitHub

```bash
# Push inicial (main branch)
git branch -M main
git push -u origin main
```

Se pedir autenticação:
- **Username:** kevisoncb
- **Password:** Use Personal Access Token (não senha!)

### 10. Criar Personal Access Token (se necessário)

Se o push pedir senha e falhar:

1. Vá para: https://github.com/settings/tokens
2. Clique em **"Generate new token (classic)"**
3. Dê um nome: "FotoZap Deploy"
4. Marque: `repo` (full control)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (não poderá ver novamente!)
7. Use o token como senha no git push

---

## 🔐 Alternativa: SSH (Recomendado)

### Configurar SSH (mais seguro):

```bash
# 1. Gerar chave SSH
ssh-keygen -t ed25519 -C "seu@email.com"
# Pressione Enter 3x (aceitar padrões)

# 2. Copiar chave pública
cat ~/.ssh/id_ed25519.pub
# Ou no Windows:
type %USERPROFILE%\.ssh\id_ed25519.pub

# 3. Adicionar no GitHub:
# - Vá para: https://github.com/settings/keys
# - Clique "New SSH key"
# - Cole a chave pública
# - Salve

# 4. Testar conexão
ssh -T git@github.com

# 5. Trocar remote para SSH
git remote set-url origin git@github.com:kevisoncb/fotozap.git

# 6. Push (sem precisar de senha)
git push -u origin main
```

---

## 📊 Verificar no GitHub

Após o push, verifique:
1. Acesse: https://github.com/kevisoncb/fotozap
2. Deve ver todos os arquivos
3. Verifique se `.env` **NÃO** foi enviado (contém secrets!)
4. Verifique se `node_modules/` **NÃO** foi enviado

---

## ⚠️ Segurança: Verificar Secrets

**IMPORTANTE:** Antes de fazer push, verifique se não há secrets expostos:

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep .env

# Verificar se .env foi adicionado por engano
git status | grep .env

# Se .env aparecer, remova:
git reset HEAD .env
```

### Secrets que NÃO devem subir:
- ❌ `.env` (todos os arquivos `.env*`)
- ❌ `JWT_SECRET`
- ❌ `DATABASE_URL` com credenciais reais
- ❌ `WHATSAPP_ACCESS_TOKEN`
- ❌ `MERCADOPAGO_ACCESS_TOKEN`
- ❌ `OPENAI_API_KEY`
- ❌ `R2_SECRET_ACCESS_KEY`

### Arquivos que DEVEM subir:
- ✅ `.env.example` (sem valores reais)
- ✅ Código fonte (TypeScript, JavaScript)
- ✅ Documentação (Markdown)
- ✅ Migrations SQL
- ✅ `package.json`, `tsconfig.json`, etc.

---

## 🔄 Próximos Commits

Depois do push inicial, para novos commits:

```bash
# 1. Ver mudanças
git status

# 2. Adicionar mudanças
git add .
# Ou arquivos específicos:
git add apps/api/src/modules/user/user.service.ts

# 3. Commit com mensagem descritiva
git commit -m "fix: corrige validação de email no login"

# 4. Push
git push
```

### Padrão de Mensagens de Commit:

```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
refactor: refatoração de código
test: adição/modificação de testes
chore: tarefas de manutenção
style: formatação de código
perf: melhoria de performance
```

---

## 📁 Estrutura que Será Enviada

```
fotozap/
├── .github/                 # (futuro: workflows CI/CD)
├── apps/
│   ├── api/                 # Backend Fastify
│   └── admin/               # Admin Next.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/          # Todas as migrations
│   └── seed*.ts
├── docs/                    # Documentação completa (~5.700 linhas)
│   ├── deploy-production.md
│   ├── quick-deploy-mock.md
│   ├── monitoring-phase12.md
│   ├── security-advanced-phase13.md
│   ├── BUILD_FIXES.md
│   └── ERROR_EXPLANATION.md
├── scripts/
│   └── create-first-admin.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── railway.json
├── Procfile
├── render.yaml
├── .env.example             # ✅ Template (sem secrets)
├── .gitignore
├── README.md
├── PROJECT_STATUS.md
├── WORK_SUMMARY.md
└── GITHUB_SETUP.md          # Este arquivo
```

**Total estimado:** ~2.000 arquivos, ~100 MB (sem node_modules)

---

## 🎯 Checklist Final

Antes de fazer push:
- [ ] `.env` está no `.gitignore`
- [ ] `node_modules/` está no `.gitignore`
- [ ] `.tools/` está no `.gitignore`
- [ ] `git status` não mostra arquivos sensíveis
- [ ] `.env.example` está no repositório
- [ ] README.md está atualizado
- [ ] Commit message é descritivo

Após push:
- [ ] Verificar no GitHub se arquivos corretos foram enviados
- [ ] `.env` **NÃO** está visível no GitHub
- [ ] `node_modules/` **NÃO** está no GitHub
- [ ] Documentação está visível

---

## 🆘 Troubleshooting

### Erro: "Repository not found"
```bash
# Verificar URL do remote
git remote -v

# Corrigir se necessário
git remote set-url origin https://github.com/kevisoncb/fotozap.git
```

### Erro: "Authentication failed"
```bash
# Use Personal Access Token ao invés de senha
# Ou configure SSH (mais seguro)
```

### Erro: "Push rejected"
```bash
# Se o repositório já tem commits no GitHub:
git pull origin main --rebase
git push -u origin main
```

### Erro: ".env foi enviado por engano"
```bash
# Remover do histórico (cuidado!)
git rm --cached .env
git commit -m "chore: remove .env from repository"
git push

# Depois TROQUE todos os secrets no .env!
```

---

## 📞 Suporte

- **Git:** https://git-scm.com/docs
- **GitHub:** https://docs.github.com
- **SSH:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

**✅ PRONTO PARA SUBIR PARA GITHUB!**

Execute os comandos acima em ordem e seu código estará no GitHub em minutos.

Lembre-se: **NUNCA** envie secrets (`.env`) para repositórios públicos!
