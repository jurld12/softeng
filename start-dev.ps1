# Healio - Startup Script
# This script starts MongoDB, Backend, and Frontend in separate terminals

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Healio Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Stop-LocalDevServers {
    Write-Host "Cleaning old local server processes..." -ForegroundColor Yellow

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
        Write-Host "✅ Stopped $stoppedCount stale local server process(es)" -ForegroundColor Green
    } else {
        Write-Host "✅ No stale local server processes found" -ForegroundColor Green
    }
}

Stop-LocalDevServers

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Start MongoDB if not running
Write-Host ""
Write-Host "Checking MongoDB container..." -ForegroundColor Yellow
$mongoStatus = docker ps -q -f name=healio-mongodb

if ($mongoStatus) {
    Write-Host "✅ MongoDB is already running" -ForegroundColor Green
} else {
    Write-Host "Starting MongoDB container..." -ForegroundColor Yellow
    docker start healio-mongodb 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "MongoDB container not found. Creating new container..." -ForegroundColor Yellow
        docker run -d `
            --name healio-mongodb `
            -p 27017:27017 `
            -e MONGO_INITDB_ROOT_USERNAME=admin `
            -e MONGO_INITDB_ROOT_PASSWORD=healio_dev_password `
            -e MONGO_INITDB_DATABASE=healio `
            -v healio-data:/data/db `
            mongo:7.0
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB container created and started" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } else {
            Write-Host "❌ Failed to start MongoDB" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ MongoDB container started" -ForegroundColor Green
        Start-Sleep -Seconds 3
    }
}

# Start Backend in new terminal
Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "backend"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; " +
    "Write-Host '========================================' -ForegroundColor Cyan; " +
    "Write-Host '   HEALIO BACKEND SERVER' -ForegroundColor Cyan; " +
    "Write-Host '========================================' -ForegroundColor Cyan; " +
    "Write-Host ''; " +
    ".\venv\Scripts\Activate.ps1; " +
    "Write-Host 'Starting FastAPI server on http://0.0.0.0:5000' -ForegroundColor Green; " +
    "Write-Host 'API Docs: http://127.0.0.1:5000/docs' -ForegroundColor Cyan; " +
    "Write-Host 'Hot reload disabled for process stability' -ForegroundColor Yellow; " +
    "Write-Host ''; " +
    "python -m uvicorn app.main:app --host 0.0.0.0 --port 5000"
)
Write-Host "✅ Backend terminal opened" -ForegroundColor Green
Start-Sleep -Seconds 2

# Start Frontend in new terminal
Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "frontend"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; " +
    "Write-Host '========================================' -ForegroundColor Cyan; " +
    "Write-Host '   HEALIO FRONTEND SERVER' -ForegroundColor Cyan; " +
    "Write-Host '========================================' -ForegroundColor Cyan; " +
    "Write-Host ''; " +
    "Write-Host 'Starting frontend server on http://localhost:3000' -ForegroundColor Green; " +
    "Write-Host ''; " +
    "python -m http.server 3000"
)
Write-Host "✅ Frontend terminal opened" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MongoDB:  Running in Docker" -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "API Docs: http://127.0.0.1:5000/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  Run: .\stop-dev.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
