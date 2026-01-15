# Healio - Complete Setup Guide (Windows)

## Prerequisites
- Python 3.10 or higher installed
- Docker Desktop installed and running
- Git installed (optional, for version control)

---

## Step 1: Create Project Structure

Open PowerShell in `c:\Users\Hayden\Documents\Study\SoftwareEngineering\App` and run:

```powershell
# Create directory structure
New-Item -ItemType Directory -Force -Path backend\app\api\routes
New-Item -ItemType Directory -Force -Path backend\app\models
New-Item -ItemType Directory -Force -Path backend\app\services
New-Item -ItemType Directory -Force -Path backend\app\middleware
New-Item -ItemType Directory -Force -Path backend\app\utils
New-Item -ItemType Directory -Force -Path backend\tests
New-Item -ItemType Directory -Force -Path frontend\css
New-Item -ItemType Directory -Force -Path frontend\js
New-Item -ItemType Directory -Force -Path frontend\assets
New-Item -ItemType Directory -Force -Path frontend\pages
```

---

## Step 2: Start MongoDB in Docker

```powershell
# Pull and run MongoDB container
docker run -d `
  --name healio-mongodb `
  -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=admin `
  -e MONGO_INITDB_ROOT_PASSWORD=healio_dev_password `
  -e MONGO_INITDB_DATABASE=healio `
  -v healio-data:/data/db `
  mongo:7.0

# Verify MongoDB is running
docker ps

# View MongoDB logs (optional)
docker logs healio-mongodb
```

**To stop MongoDB later:**
```powershell
docker stop healio-mongodb
```

**To start MongoDB again:**
```powershell
docker start healio-mongodb
```

**To completely remove and reset:**
```powershell
docker stop healio-mongodb
docker rm healio-mongodb
docker volume rm healio-data
```

---

## Step 3: Set Up Backend (Python + FastAPI)

```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run this first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Upgrade pip
python -m pip install --upgrade pip

# Install required packages
pip install fastapi uvicorn[standard] pymongo python-jose[cryptography] passlib[bcrypt] python-multipart pydantic-settings python-dotenv email-validator

# Generate requirements.txt
pip freeze > requirements.txt

# Stay in backend directory for next steps
```

---

## Step 4: Run Backend Server

```powershell
# Make sure you're in backend directory with venv activated
# Run the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 5000

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:5000
# INFO:     Application startup complete.
```

**Access backend:**
- API: http://127.0.0.1:5000
- Interactive docs: http://127.0.0.1:5000/docs
- Alternative docs: http://127.0.0.1:5000/redoc

---

## Step 5: Set Up Frontend (Basic HTML/CSS/JS)

Open a **NEW PowerShell window** (keep backend running in the first one):

```powershell
# Navigate to frontend directory
cd c:\Users\Hayden\Documents\Study\SoftwareEngineering\App\frontend

# Install a simple HTTP server (optional, or just open HTML files directly)
# Option 1: Using Python's built-in server
python -m http.server 3000

# Option 2: Using Node.js http-server (if you have Node installed)
# npx http-server -p 3000 -c-1

# Option 3: Just open frontend\index.html in your browser (no server needed for now)
```

**Access frontend:**
- http://localhost:3000

---

## Step 6: Complete Startup Commands (Daily Use)

Create a file `start-all.ps1` in the root directory for easy startup:

```powershell
# Create startup script
@"
Write-Host "Starting Healio Development Environment..." -ForegroundColor Green

# Start MongoDB if not running
`$mongoStatus = docker ps -q -f name=healio-mongodb
if (-not `$mongoStatus) {
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    docker start healio-mongodb
    Start-Sleep -Seconds 3
}

Write-Host "MongoDB is running" -ForegroundColor Green
Write-Host "Backend: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --host 127.0.0.1 --port 5000" -ForegroundColor Cyan
Write-Host "Frontend: cd frontend && python -m http.server 3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual steps:"
Write-Host "1. Open terminal 1: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --host 127.0.0.1 --port 5000"
Write-Host "2. Open terminal 2: cd frontend && python -m http.server 3000"
"@ | Out-File -FilePath start-all.ps1 -Encoding UTF8

Write-Host "Created start-all.ps1" -ForegroundColor Green
```

---

## Step 7: Verify Everything Works

1. **Check MongoDB:**
   ```powershell
   docker exec -it healio-mongodb mongosh -u admin -p healio_dev_password
   # Inside mongo shell:
   # show dbs
   # use healio
   # exit
   ```

2. **Check Backend:**
   - Visit http://127.0.0.1:5000/docs
   - You should see FastAPI Swagger UI

3. **Check Frontend:**
   - Visit http://localhost:3000
   - Basic page should load

---

## Environment Variables Reference

Backend `.env` file location: `backend/.env`

Key variables:
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET_KEY`: Secret for signing JWT tokens
- `BACKEND_PORT`: Backend server port (default: 5000)
- `FRONTEND_PORT`: Frontend server port (default: 3000)
- `JWT_EXPIRATION_HOURS`: Token expiration time (default: 24)

Frontend `config.js` file location: `frontend/js/config.js`

Key variables:
- `API_BASE_URL`: Backend API URL

---

## Troubleshooting

**Docker MongoDB won't start:**
```powershell
# Check if port 27017 is in use
netstat -ano | findstr :27017

# Remove existing container and try again
docker rm -f healio-mongodb
docker volume rm healio-data
# Then run Step 2 again
```

**Virtual environment activation fails:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Backend import errors:**
```powershell
# Make sure venv is activated
cd backend
.\venv\Scripts\Activate.ps1
# Reinstall packages
pip install -r requirements.txt
```

**Port already in use:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

## Quick Reference Commands

**Daily Startup:**
```powershell
# Terminal 1: Backend
cd c:\Users\Hayden\Documents\Study\SoftwareEngineering\App\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 5000

# Terminal 2: Frontend  
cd c:\Users\Hayden\Documents\Study\SoftwareEngineering\App\frontend
python -m http.server 3000

# MongoDB runs automatically via Docker
```

**Shutdown:**
```powershell
# Stop servers: Ctrl+C in each terminal
# Stop MongoDB (optional):
docker stop healio-mongodb
```

**Reset Database:**
```powershell
docker exec -it healio-mongodb mongosh -u admin -p healio_dev_password --eval "use healio; db.dropDatabase()"
```
