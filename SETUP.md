# Healio - Setup Guide (Windows + macOS)

## Simplest Way To Run

If you already cloned the repo and installed prerequisites, daily usage is just:

- Windows: run `./start-dev.ps1`, then `./stop-dev.ps1` when done
- macOS: run `./start-dev-mac.sh`, then `./stop-dev-mac.sh` when done

## Prerequisites

- Python 3.10+
- Docker Desktop
- Git

Quick checks:

Windows (PowerShell):
```powershell
py -3 --version
docker --version
docker compose version
```

macOS (Terminal):
```bash
python3 --version
docker --version
docker compose version
```

## One-Time Setup (Fresh Clone)

### Windows

```powershell
cd backend
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

### macOS

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
chmod +x start-dev-mac.sh stop-dev-mac.sh
```

## Optional Backend Environment File

Create `backend/.env` if you want explicit local config:

```env
MONGODB_URL=mongodb://admin:healio_dev_password@localhost:27017/healio?authSource=admin
MONGODB_DATABASE=healio
JWT_SECRET_KEY=replace-this-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
BACKEND_PORT=5000
FRONTEND_PORT=3000
MONGODB_PORT=27017
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000
```

If this file is missing, defaults in `backend/config.py` are used.

## Daily Run

### Windows

```powershell
.\start-dev.ps1
```

Stop:

```powershell
.\stop-dev.ps1
```

### macOS

```bash
./start-dev-mac.sh
```

Stop:

```bash
./stop-dev-mac.sh
```

## Verify It Works

1. Backend health:
```bash
curl http://127.0.0.1:5000/health
```

2. Backend docs:
- http://127.0.0.1:5000/docs

3. Frontend:
- http://localhost:3000

## Common Issues

### Docker is not running

Start Docker Desktop and rerun start script.

### Script permission denied on macOS

```bash
chmod +x start-dev-mac.sh stop-dev-mac.sh
```

### PowerShell blocks scripts on Windows

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Missing Python modules

```bash
cd backend
source venv/bin/activate  # macOS
pip install -r requirements.txt
```

Windows activation command:
```powershell
.\venv\Scripts\Activate.ps1
```

### Endpoint exists in code but returns 404

Usually caused by stale backend processes. Run the stop script, then start again.

### Reset local database

```bash
docker compose down
docker volume rm healio-data
docker compose up -d mongodb
```
