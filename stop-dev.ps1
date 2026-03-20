# Healio - Shutdown Script
# This script stops all running services

Write-Host "========================================" -ForegroundColor Red
Write-Host "   Stopping Healio Services" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

function Stop-LocalDevServers {
    Write-Host "Stopping local backend/frontend servers..." -ForegroundColor Yellow

    $stoppedCount = 0
    $commandPatterns = @(
        "*uvicorn*app.main:app*--port 5000*",
        "*python*http.server 3000*"
    )

    foreach ($pattern in $commandPatterns) {
        $processes = Get-CimInstance Win32_Process | Where-Object {
            $_.CommandLine -like $pattern
        }

        foreach ($process in $processes) {
            try {
                Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
                $stoppedCount++
            } catch {
                # Ignore already exited processes
            }
        }
    }

    foreach ($port in @(5000, 3000)) {
        $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($listener in $listeners) {
            try {
                Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
                $stoppedCount++
            } catch {
                # Ignore protected or already exited processes
            }
        }
    }

    if ($stoppedCount -gt 0) {
        Write-Host "✅ Stopped $stoppedCount local server process(es)" -ForegroundColor Green
    } else {
        Write-Host "✅ No local server processes were running" -ForegroundColor Green
    }
}

Stop-LocalDevServers

# Stop MongoDB
Write-Host "Stopping MongoDB container..." -ForegroundColor Yellow
docker stop healio-mongodb 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MongoDB stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB was not running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend and frontend server processes have been stopped." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
