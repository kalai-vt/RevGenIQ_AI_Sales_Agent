# RevGenIQ AI — Local development setup
# Run from the monorepo root directory:  .\07_Deployment\deployment\setup.ps1

param(
    [switch]$SkipDocker,
    [switch]$SkipMigrations
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "`n==  RevGenIQ AI Setup  ==" -ForegroundColor Cyan

# ── 1. Docker services ────────────────────────────────────────────────────────
if (-not $SkipDocker) {
    Write-Host "`n[1/4] Starting PostgreSQL, Redis, Qdrant via Docker..." -ForegroundColor Yellow

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Warning "Docker not found. Install Docker Desktop and retry, or use -SkipDocker and run PG manually."
    } else {
        Push-Location $Root
        docker compose up -d postgres redis qdrant
        Write-Host "Waiting 5s for PostgreSQL to be ready..." -ForegroundColor DarkGray
        Start-Sleep 5
        Pop-Location
    }
} else {
    Write-Host "`n[1/4] Skipping Docker (make sure PostgreSQL is running on localhost:5432)" -ForegroundColor DarkGray
}

# ── 2. Python venv ────────────────────────────────────────────────────────────
Write-Host "`n[2/4] Setting up Python virtual environment..." -ForegroundColor Yellow
$BackendDir = Join-Path $Root "backend"
$VenvDir    = Join-Path $BackendDir ".venv"

Push-Location $BackendDir

if (-not (Test-Path $VenvDir)) {
    python -m venv .venv
    Write-Host "  Created .venv" -ForegroundColor Green
} else {
    Write-Host "  .venv already exists, skipping creation" -ForegroundColor DarkGray
}

$Pip = Join-Path $VenvDir "Scripts\pip.exe"
& $Pip install -r requirements.txt --quiet
Write-Host "  Dependencies installed" -ForegroundColor Green

# ── 3. Alembic migrations ─────────────────────────────────────────────────────
if (-not $SkipMigrations) {
    Write-Host "`n[3/4] Running Alembic migrations..." -ForegroundColor Yellow
    $Alembic = Join-Path $VenvDir "Scripts\alembic.exe"

    # Create the database if it doesn't exist (psql required)
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        psql -h localhost -U postgres -c "CREATE DATABASE agentsaas;" 2>$null
        psql -h localhost -U postgres -c "CREATE USER agentsaas WITH PASSWORD 'agentsaas_secret';" 2>$null
        psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE agentsaas TO agentsaas;" 2>$null
        Write-Host "  Database created/verified" -ForegroundColor Green
    } else {
        Write-Host "  psql not in PATH — ensure the database 'agentsaas' exists with user 'agentsaas'" -ForegroundColor DarkYellow
    }

    & $Alembic upgrade head
    Write-Host "  Migrations applied" -ForegroundColor Green
} else {
    Write-Host "`n[3/4] Skipping migrations (-SkipMigrations)" -ForegroundColor DarkGray
}

# ── 4. Frontend dependencies ──────────────────────────────────────────────────
Write-Host "`n[4/4] Installing frontend dependencies..." -ForegroundColor Yellow
$FrontendDir = Join-Path $Root "frontend"
Push-Location $FrontendDir
npm install --silent
Pop-Location
Write-Host "  npm packages installed" -ForegroundColor Green

Pop-Location  # backend

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "`n== Setup complete! ==" -ForegroundColor Green
Write-Host @"

Start the backend:
  cd backend
  .venv\Scripts\uvicorn main:app --reload --port 8000

Start the frontend (new terminal):
  cd frontend
  npm run dev

API docs: http://localhost:8000/docs
Dashboard: http://localhost:3000
"@ -ForegroundColor Cyan
