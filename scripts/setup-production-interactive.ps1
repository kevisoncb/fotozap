# Setup Production - Interactive
# Guia interativo para configurar produção

Write-Host "`n🚀 FotoZap IA - Setup de Produção Interativo`n" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Step 1: Railway API URL
Write-Host "📍 Etapa 1/5: URL da API Railway`n" -ForegroundColor Yellow
Write-Host "Como encontrar:" -ForegroundColor White
Write-Host "  1. Abra https://railway.app/" -ForegroundColor Gray
Write-Host "  2. Projeto: fotozap" -ForegroundColor Gray
Write-Host "  3. Service: fotozap-api" -ForegroundColor Gray
Write-Host "  4. Settings > Networking > Public URL" -ForegroundColor Gray
Write-Host ""

$apiUrl = Read-Host "Cole a URL da API (ex: https://fotozap-api-production-xxxx.up.railway.app)"

if (-not $apiUrl) {
    Write-Host "`n❌ URL não fornecida. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Test API
Write-Host "📡 Etapa 2/5: Testando API...`n" -ForegroundColor Yellow

try {
    $healthResponse = Invoke-WebRequest -Uri "$apiUrl/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
    
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ API está respondendo!" -ForegroundColor Green
        Write-Host "   Status: 200 OK" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ API não está respondendo" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  • Deploy Railway ainda em andamento (aguarde 2-3 min)" -ForegroundColor White
    Write-Host "  • URL incorreta" -ForegroundColor White
    Write-Host "  • DATABASE_URL ou REDIS_URL não configurados" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($continue -ne "s") {
        exit 1
    }
}

Write-Host ""

# Step 3: DATABASE_URL
Write-Host "🗄️  Etapa 3/5: DATABASE_URL`n" -ForegroundColor Yellow
Write-Host "Como encontrar:" -ForegroundColor White
Write-Host "  1. Railway > Service: PostgreSQL" -ForegroundColor Gray
Write-Host "  2. Tab: Variables" -ForegroundColor Gray
Write-Host "  3. Procure: DATABASE_URL" -ForegroundColor Gray
Write-Host "  4. Click 👁️  para revelar e copie TUDO" -ForegroundColor Gray
Write-Host ""

$databaseUrl = Read-Host "Cole o DATABASE_URL (começa com postgresql://)"

if (-not $databaseUrl -or $databaseUrl -notmatch '^postgresql://') {
    Write-Host "`n❌ DATABASE_URL inválido. Deve começar com postgresql://" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Run migrations
Write-Host "📦 Etapa 4/5: Configurando banco de dados...`n" -ForegroundColor Yellow

$env:DATABASE_URL = $databaseUrl

Write-Host "Rodando migrations..." -ForegroundColor White
npm run db:migrate:deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Migrations falharam" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Migrations completas" -ForegroundColor Green
Write-Host ""

Write-Host "Seeding produtos..." -ForegroundColor White
npm run db:seed:production

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Seed pode ter falhado (pode ser normal se já executado antes)" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Produtos criados" -ForegroundColor Green
}

Write-Host ""

# Step 5: Create admin
Write-Host "👤 Etapa 5/5: Criar primeiro admin`n" -ForegroundColor Yellow
Write-Host "Você será solicitado a fornecer:" -ForegroundColor White
Write-Host "  • Email (ex: admin@fotozap.com)" -ForegroundColor Gray
Write-Host "  • Nome (ex: Admin Master)" -ForegroundColor Gray
Write-Host "  • Senha (min 8 caracteres, FORTE)" -ForegroundColor Gray
Write-Host ""

npm run admin:create

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Admin pode não ter sido criado" -ForegroundColor Yellow
    Write-Host "   Isso é normal se já existe um admin" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 6: Summary
Write-Host "✅ Setup de banco completo!`n" -ForegroundColor Green

Write-Host "📋 Próximas ações:`n" -ForegroundColor Yellow

Write-Host "1. Ativar Mercado Pago + OpenAI:" -ForegroundColor White
Write-Host "   .\scripts\enable-providers.ps1" -ForegroundColor Gray
Write-Host "   (Copiar saída e colar no Railway > Variables)" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Configurar Cloudflare R2 (10 min):" -ForegroundColor White
Write-Host "   Abra: CLOUDFLARE_R2_SETUP.md" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Configurar Meta WhatsApp (30 min):" -ForegroundColor White
Write-Host "   Abra: META_WHATSAPP_SETUP.md" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Smoke test:" -ForegroundColor White
Write-Host "   Enviar mensagem WhatsApp e testar fluxo completo" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Sistema 40% operacional!`n" -ForegroundColor Cyan
