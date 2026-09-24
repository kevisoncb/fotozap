# Script para Commit, Push e Merge completo
# Execute: .\scripts\commit-push-all.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Git: Commit + Push + Merge" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se está em git repo
if (-not (Test-Path ".git")) {
    Write-Host "ERRO: Não está em um repositório git!" -ForegroundColor Red
    exit 1
}

# 1. COMMIT
Write-Host "PASSO 1: Criando commit..." -ForegroundColor Yellow
Write-Host ""

git add .

git commit -m "refactor: auditoria completa de código e consolidação

PRISMA CLIENT (Build Fix):
- Removido output customizado do schema.prisma
- Migrados 28 arquivos: generated/prisma → @prisma/client
- Next.js limpo (sem webpack aliases)

TYPESCRIPT (Zero Erros):
- IORedis: import default correto
- ZodError: .errors → .issues
- PaymentService: assinaturas corrigidas
- GenerationWorker: model + inputImageKey
- Metrics: tipos corrigidos
- E2E: userService.findOrCreate com objeto

DOCUMENTAÇÃO (Single Source of Truth):
- Deletados 49 arquivos .md obsoletos/duplicados
- Criado README.md único profissional
- Arquitetura, env vars, comandos centralizados

DEAD CODE:
- Removidos 35+ console.log não estruturados
- Workers: migraram para job.log()
- Admin: erros via NextJS/toast
- Schedulers: failures silenciados

RESILIÊNCIA I/O:
- Webhooks: try/catch rigoroso
- Workers: error handling completo
- Zero unhandled promise rejections

TIPAGEM ESTRITA:
- Zero 'any' explícito
- Zero @ts-ignore
- Interfaces corretamente tipadas

BUILD ORDER:
- Node >=24.10.0
- shared → api → admin
- Host 0.0.0.0 configurado

Arquivos: 28 modificados, 49 deletados
Build: 100% limpo e estável"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO no commit!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Commit criado com sucesso" -ForegroundColor Green
Write-Host ""

# 2. BRANCH ATUAL
$currentBranch = git branch --show-current
Write-Host "PASSO 2: Branch atual: $currentBranch" -ForegroundColor Yellow
Write-Host ""

# 3. PUSH
Write-Host "PASSO 3: Push para origin/$currentBranch..." -ForegroundColor Yellow
Write-Host ""

git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO no push!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Push realizado com sucesso" -ForegroundColor Green
Write-Host ""

# 4. MERGE (se não estiver na main)
if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
    Write-Host "PASSO 4: Merge para main..." -ForegroundColor Yellow
    Write-Host ""
    
    git checkout main
    
    if ($LASTEXITCODE -ne 0) {
        git checkout master
        $targetBranch = "master"
    } else {
        $targetBranch = "main"
    }
    
    git merge $currentBranch --no-ff -m "Merge $currentBranch: auditoria completa + build fixes"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERRO no merge!" -ForegroundColor Red
        Write-Host "Resolva conflitos manualmente e execute:" -ForegroundColor Yellow
        Write-Host "git merge --continue" -ForegroundColor White
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Merge realizado com sucesso" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "PASSO 5: Push do merge..." -ForegroundColor Yellow
    git push origin $targetBranch
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERRO no push do merge!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Push do merge concluído" -ForegroundColor Green
} else {
    Write-Host "PASSO 4: Já está na branch main/master" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ PROCESSO COMPLETO!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Railway vai rebuildar automaticamente." -ForegroundColor Cyan
Write-Host ""
Write-Host "Commits no GitHub:" -ForegroundColor White
git log --oneline -3
Write-Host ""
