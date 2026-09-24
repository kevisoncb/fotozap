# Enable Real Providers
# Script to generate Railway environment variable commands

Write-Host "⚙️  FotoZap - Enable Real Providers" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Copy these commands to Railway Dashboard > Variables:" -ForegroundColor Yellow
Write-Host ""

Write-Host "# ===== Payment Provider (Mercado Pago) =====" -ForegroundColor Cyan
Write-Host "PAYMENT_PROVIDER=real"
Write-Host "MERCADOPAGO_ACCESS_TOKEN=APP_USR-8771882382813570-092409-502a0abb4fec3a89590aff1b16e94835-344172738"
Write-Host "MERCADOPAGO_WEBHOOK_SECRET=37ccfa3dbf6d09c9936b400ad3e56f5a2309bbfe89a87d28a6b11934c8e14785"
Write-Host ""

Write-Host "# ===== Image Provider (OpenAI) =====" -ForegroundColor Cyan
Write-Host "IMAGE_PROVIDER=openai"
Write-Host "OPENAI_API_KEY="sua_chave_aqui"
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After setting these variables:" -ForegroundColor Yellow
Write-Host "  1. Click 'Save' in Railway" -ForegroundColor White
Write-Host "  2. Railway will automatically restart the service" -ForegroundColor White
Write-Host "  3. Check logs for 'System fully initialized'" -ForegroundColor White
Write-Host ""

Write-Host "Expected log output:" -ForegroundColor Yellow
Write-Host '  "whatsapp": "mock"' -ForegroundColor Gray
Write-Host '  "payment": "real"' -ForegroundColor Green
Write-Host '  "storage": "mock"' -ForegroundColor Gray
Write-Host '  "image": "openai"' -ForegroundColor Green
Write-Host ""
