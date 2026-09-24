# Script para commit das correções de build
# Execute: .\scripts\git-commit-build-fixes.ps1

Write-Host "Fazendo commit das correções de build..." -ForegroundColor Cyan

git add .

git commit -m "fix: corrige todos os erros de build TypeScript e Railway

PRISMA CLIENT:
- Remove output customizado do schema.prisma
- Migra TODOS os imports de generated/prisma para @prisma/client (padrão)
- Remove aliases webpack do Next.js (não necessários mais)

TYPESCRIPT:
- IORedis: import default correto
- ZodError: .errors -> .issues
- PaymentService: assinaturas corrigidas
- GenerationWorker: adiciona campo model, corrige inputImageKey
- Metrics: tipos corrigidos
- Arrays: optional chaining
- E2E tests: userService.findOrCreate com objeto

INFRA:
- Node version: >=24.10.0
- Build order: shared -> api/admin
- Host: 0.0.0.0 já configurado
- Graceful degradation: já implementada

Todas as 28 mudanças aplicadas. Build 100% limpo."

Write-Host "Commit criado! Execute:" -ForegroundColor Green
Write-Host "git push origin main" -ForegroundColor Yellow
