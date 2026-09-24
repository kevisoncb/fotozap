# Script PowerShell: Criar nova feature branch
# Uso: .\scripts\git-feature.ps1 "nome-da-feature"

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName
)

Write-Host "🌿 Nova Feature Branch" -ForegroundColor Cyan
Write-Host ""

# Verificar Git
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git não encontrado" -ForegroundColor Red
    exit 1
}

# Normalizar nome (remover espaços, caracteres especiais)
$branchName = $FeatureName.ToLower() -replace '[^a-z0-9-]', '-' -replace '-+', '-'
$branchName = "feature/$branchName"

Write-Host "📝 Branch: $branchName" -ForegroundColor Gray
Write-Host ""

# Verificar se há mudanças não commitadas
$status = git status --porcelain

if ($status) {
    Write-Host "⚠️  Você tem mudanças não commitadas:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $save = Read-Host "Fazer commit antes de criar branch? (s/n)"
    
    if ($save -eq "s") {
        $message = Read-Host "Mensagem do commit"
        git add .
        git commit -m "$message"
        Write-Host "✅ Commit realizado" -ForegroundColor Green
        Write-Host ""
    }
}

# Atualizar main
Write-Host "🔄 Atualizando main..." -ForegroundColor Cyan
git checkout main
git pull origin main

# Criar e mudar para nova branch
Write-Host "🌿 Criando branch $branchName..." -ForegroundColor Cyan
git checkout -b $branchName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Branch criada e ativada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Faça suas alterações" -ForegroundColor Gray
    Write-Host "   2. git add . && git commit -m 'feat: sua feature'" -ForegroundColor Gray
    Write-Host "   3. git push -u origin $branchName" -ForegroundColor Gray
    Write-Host "   4. Abra Pull Request no GitHub" -ForegroundColor Gray
} else {
    Write-Host "❌ Erro ao criar branch" -ForegroundColor Red
    exit 1
}
