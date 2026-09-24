# Script para corrigir build do Railway
# Faz commit das correções e push para GitHub

Write-Host "=== FotoZap: Fix Railway Deploy ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path ".\package.json")) {
    Write-Host "ERRO: Execute este script na raiz do projeto (fotozap)" -ForegroundColor Red
    exit 1
}

Write-Host "1. Verificando status do repositório..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Git não encontrado ou repositório não inicializado" -ForegroundColor Red
    Write-Host "Saída: $gitStatus" -ForegroundColor Gray
    exit 1
}

Write-Host "   ✓ Repositório OK" -ForegroundColor Green
Write-Host ""

# Verificar branch atual
Write-Host "2. Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Não foi possível identificar o branch" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Branch: $currentBranch" -ForegroundColor Green
Write-Host ""

# Adicionar todas as mudanças
Write-Host "3. Adicionando mudanças ao staging..." -ForegroundColor Yellow
git add . 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao adicionar arquivos" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Arquivos adicionados" -ForegroundColor Green
Write-Host ""

# Fazer commit
Write-Host "4. Criando commit..." -ForegroundColor Yellow
$commitMessage = "fix(build): corrigir configuração do Prisma para deploy

- Schema do Prisma sem output customizado (usa padrão node_modules)
- Todos os imports TypeScript corrigidos para @prisma/client
- Monorepo build order correto (shared -> api/admin)
- Types completos (@types/bcrypt, @types/jsonwebtoken)
- Graceful degradation para provedores externos
- Fastify listen em 0.0.0.0 para Railway

Fixes #railway-build-errors"

git commit -m "$commitMessage" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Nenhuma mudança para commitar (ou erro no commit)" -ForegroundColor Yellow
    $hasChanges = $false
} else {
    Write-Host "   ✓ Commit criado" -ForegroundColor Green
    $hasChanges = $true
}
Write-Host ""

# Push para origin
Write-Host "5. Enviando para GitHub..." -ForegroundColor Yellow
if ($hasChanges) {
    git push origin $currentBranch 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao fazer push" -ForegroundColor Red
        Write-Host "Tente manualmente: git push origin $currentBranch" -ForegroundColor Gray
        exit 1
    }
    Write-Host "   ✓ Push concluído" -ForegroundColor Green
} else {
    Write-Host "   ⊘ Sem mudanças para enviar" -ForegroundColor Gray
}
Write-Host ""

# Merge para master (se não estiver na master)
if ($currentBranch -ne "master" -and $currentBranch -ne "main") {
    Write-Host "6. Fazendo merge para master..." -ForegroundColor Yellow
    
    # Checkout para master
    git checkout master 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git checkout main 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO: Branch master/main não encontrado" -ForegroundColor Red
            exit 1
        }
        $masterBranch = "main"
    } else {
        $masterBranch = "master"
    }
    
    # Pull para garantir que está atualizado
    git pull origin $masterBranch 2>&1 | Out-Null
    
    # Merge
    git merge $currentBranch --no-edit 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Conflito no merge. Resolva manualmente" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Merge concluído ($currentBranch -> $masterBranch)" -ForegroundColor Green
    
    # Push do master
    git push origin $masterBranch 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao fazer push do $masterBranch" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ $masterBranch atualizado no GitHub" -ForegroundColor Green
} else {
    Write-Host "6. Branch atual já é $currentBranch (sem merge necessário)" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "=== ✓ Deploy Fix Concluído ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Aguarde o Railway detectar o push e iniciar novo deploy" -ForegroundColor White
Write-Host "2. Acesse o dashboard da Railway para acompanhar o build" -ForegroundColor White
Write-Host "3. Verifique os logs de build para confirmar sucesso" -ForegroundColor White
Write-Host ""
Write-Host "Monitoramento:" -ForegroundColor Yellow
Write-Host "- Build: https://railway.app/project/[seu-projeto]/service/[seu-service]" -ForegroundColor Gray
Write-Host "- API Health: https://[seu-dominio].up.railway.app/health" -ForegroundColor Gray
Write-Host ""
