# Script PowerShell: Git Commit & Push Automatizado
# Uso: .\scripts\git-commit-push.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [string]$Branch = "main"
)

Write-Host "🚀 FotoZap - Git Commit & Push" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script da raiz do projeto" -ForegroundColor Red
    exit 1
}

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "   Instale: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📊 Status atual:" -ForegroundColor Cyan

# Status
git status --short

Write-Host ""
$confirm = Read-Host "Deseja continuar? (s/n)"

if ($confirm -ne "s") {
    Write-Host "❌ Cancelado pelo usuário" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📦 Adicionando arquivos..." -ForegroundColor Cyan

# Add all
git add .

Write-Host "✅ Arquivos adicionados" -ForegroundColor Green

Write-Host ""
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
Write-Host "   Mensagem: $Message" -ForegroundColor Gray

# Commit
git commit -m "$Message"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no commit" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit realizado" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Fazendo push para origin/$Branch..." -ForegroundColor Cyan

# Push
git push origin $Branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no push" -ForegroundColor Red
    Write-Host "   Tente: git push -u origin $Branch" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Push concluído com sucesso!" -ForegroundColor Green
Write-Host "🎉 Código enviado para GitHub!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver em: https://github.com/kevisoncb/fotozap" -ForegroundColor Blue
