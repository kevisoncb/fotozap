# Script PowerShell: Quick Save - Commit rápido com timestamp
# Uso: .\scripts\git-quick-save.ps1

Write-Host "⚡ Quick Save - FotoZap" -ForegroundColor Cyan
Write-Host ""

# Verificar Git
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git não encontrado" -ForegroundColor Red
    exit 1
}

# Gerar mensagem com timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "chore: quick save - $timestamp"

Write-Host "📊 Arquivos modificados:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "💾 Salvando alterações..." -ForegroundColor Cyan

# Add, commit, push
git add .
git commit -m "$message"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit: $message" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🚀 Enviando para GitHub..." -ForegroundColor Cyan
    
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Enviado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Push falhou - envie manualmente" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Nada para commitar" -ForegroundColor Blue
}
