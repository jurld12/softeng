# Healio - Shutdown Script
# This script stops all running services

Write-Host "========================================" -ForegroundColor Red
Write-Host "   Stopping Healio Services" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Stop MongoDB
Write-Host "Stopping MongoDB container..." -ForegroundColor Yellow
docker stop healio-mongodb 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MongoDB stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB was not running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: Backend and Frontend terminals must be closed manually (Ctrl+C)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
