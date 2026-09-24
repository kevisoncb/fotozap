# Setup Production Database
# Run migrations and seed data for Railway production environment

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigrations,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSeed
)

Write-Host "🗄️  FotoZap - Production Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is provided
if (-not $DatabaseUrl) {
    if ($env:DATABASE_URL) {
        $DatabaseUrl = $env:DATABASE_URL
        Write-Host "✓ Using DATABASE_URL from environment" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: DATABASE_URL not provided" -ForegroundColor Red
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\setup-production-db.ps1 -DatabaseUrl 'postgresql://...'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or set environment variable:" -ForegroundColor Yellow
        Write-Host "  `$env:DATABASE_URL='postgresql://...'" -ForegroundColor Yellow
        Write-Host "  .\setup-production-db.ps1" -ForegroundColor Yellow
        exit 1
    }
}

# Validate DATABASE_URL format
if ($DatabaseUrl -notmatch '^postgresql://') {
    Write-Host "❌ ERROR: Invalid DATABASE_URL format" -ForegroundColor Red
    Write-Host "   Expected: postgresql://user:pass@host:port/database" -ForegroundColor Yellow
    exit 1
}

Write-Host "Database: $($DatabaseUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray
Write-Host ""

# Set environment variable for commands
$env:DATABASE_URL = $DatabaseUrl

try {
    # Step 1: Run migrations
    if (-not $SkipMigrations) {
        Write-Host "📦 Step 1/3: Running database migrations..." -ForegroundColor Yellow
        npm run db:migrate:deploy
        
        if ($LASTEXITCODE -ne 0) {
            throw "Migration failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "✓ Migrations completed" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping migrations" -ForegroundColor Gray
        Write-Host ""
    }

    # Step 2: Seed products
    if (-not $SkipSeed) {
        Write-Host "🌱 Step 2/3: Seeding products..." -ForegroundColor Yellow
        npm run db:seed:production
        
        if ($LASTEXITCODE -ne 0) {
            throw "Seed failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "✓ Products seeded" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping seed" -ForegroundColor Gray
        Write-Host ""
    }

    # Step 3: Create admin
    Write-Host "👤 Step 3/3: Create first admin user" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run manually:" -ForegroundColor Cyan
    Write-Host "  npm run admin:create" -ForegroundColor White
    Write-Host ""
    Write-Host "Or via Railway CLI:" -ForegroundColor Cyan
    Write-Host "  railway run npm run admin:create" -ForegroundColor White
    Write-Host ""

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ Database setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Create first admin (see above)" -ForegroundColor White
    Write-Host "  2. Enable real providers in Railway" -ForegroundColor White
    Write-Host "  3. Configure Cloudflare R2" -ForegroundColor White
    Write-Host "  4. Configure WhatsApp/Meta" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
