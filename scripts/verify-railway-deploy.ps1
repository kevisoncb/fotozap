# Verify Railway Deployment
# Tests API endpoints to confirm deployment is healthy

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

Write-Host "🔍 FotoZap - Railway Deployment Verification" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Remove trailing slash
$ApiUrl = $ApiUrl.TrimEnd('/')

Write-Host "API URL: $ApiUrl" -ForegroundColor Gray
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "Testing $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✓" -ForegroundColor Green
            
            # Try to parse JSON
            try {
                $json = $response.Content | ConvertFrom-Json
                Write-Host "  Response: $($json | ConvertTo-Json -Compress)" -ForegroundColor Gray
            } catch {
                Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor Gray
            }
            
            return $true
        } else {
            Write-Host " ✗ (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "🏥 Health Checks:" -ForegroundColor Yellow
Write-Host ""

$rootOk = Test-Endpoint -Url "$ApiUrl/" -Name "Root endpoint (GET /)"
Write-Host ""

$healthOk = Test-Endpoint -Url "$ApiUrl/health" -Name "Health check (GET /health)"
Write-Host ""

$readyOk = Test-Endpoint -Url "$ApiUrl/ready" -Name "Ready check (GET /ready)"
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan

if ($rootOk -and $healthOk) {
    Write-Host "✅ Deployment is HEALTHY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "API is responding correctly." -ForegroundColor White
    Write-Host "You can proceed with database setup and provider configuration." -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ Deployment has ISSUES!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "  1. Check Railway logs for errors" -ForegroundColor White
    Write-Host "  2. Verify build completed successfully" -ForegroundColor White
    Write-Host "  3. Confirm DATABASE_URL and REDIS_URL are set" -ForegroundColor White
    Write-Host "  4. Check if service is running (not crashed)" -ForegroundColor White
    Write-Host ""
    exit 1
}
