# Script para testar o build localmente
# Execute: .\scripts\test-build.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testando Build Completo" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Gerando Prisma Client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Compilando pacote shared..." -ForegroundColor Yellow
npm run build:shared
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao compilar shared" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Compilando API..." -ForegroundColor Yellow
npm run build:api
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao compilar API" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. Compilando Admin..." -ForegroundColor Yellow
npm run build:admin
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao compilar Admin" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "BUILD 100% LIMPO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. .\scripts\git-commit-build-fixes.ps1" -ForegroundColor Yellow
Write-Host "2. git push origin main" -ForegroundColor Yellow
