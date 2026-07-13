# Quick PostgreSQL + Redis setup without Docker
# Uses winget to install PostgreSQL if not present, then creates the database.
# Run from any directory: .\scripts\start-db.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n== Database Setup (no Docker) ==" -ForegroundColor Cyan

# ── 1. Install PostgreSQL via winget if missing ───────────────────────────────
$pgBin = ""
$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin"
)
foreach ($p in $pgPaths) {
    if (Test-Path (Join-Path $p "psql.exe")) { $pgBin = $p; break }
}

if (-not $pgBin) {
    Write-Host "PostgreSQL not found. Installing via winget..." -ForegroundColor Yellow
    winget install -e --id PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
    $pgBin = "C:\Program Files\PostgreSQL\17\bin"
    Write-Host "PostgreSQL installed. You may need to set a postgres superuser password." -ForegroundColor Green
}

$psql = Join-Path $pgBin "psql.exe"
Write-Host "Using psql: $psql" -ForegroundColor DarkGray

# ── 2. Ensure PostgreSQL service is running ────────────────────────────────────
$pgSvc = Get-Service | Where-Object { $_.Name -match "^postgresql" } | Select-Object -First 1
if ($pgSvc) {
    if ($pgSvc.Status -ne "Running") {
        Start-Service $pgSvc.Name
        Write-Host "Started service: $($pgSvc.Name)" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL service already running: $($pgSvc.Name)" -ForegroundColor DarkGray
    }
} else {
    Write-Warning "No PostgreSQL Windows service found. Start it manually."
}

Start-Sleep 2

# ── 3. Create database and user ────────────────────────────────────────────────
Write-Host "`nCreating database and user..." -ForegroundColor Yellow

$env:PGPASSWORD = "postgres"  # default superuser password — change if needed

$cmds = @(
    "CREATE DATABASE agentsaas;",
    "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'agentsaas') THEN CREATE USER agentsaas WITH PASSWORD 'agentsaas_secret'; END IF; END `$`$;",
    "GRANT ALL PRIVILEGES ON DATABASE agentsaas TO agentsaas;",
    "ALTER DATABASE agentsaas OWNER TO agentsaas;"
)

foreach ($cmd in $cmds) {
    & $psql -h localhost -U postgres -c $cmd 2>$null
}

Write-Host "Database ready: postgresql://agentsaas:agentsaas_secret@localhost:5432/agentsaas" -ForegroundColor Green

# ── 4. Run Alembic migrations ─────────────────────────────────────────────────
$BackendDir = Join-Path (Split-Path $PSScriptRoot -Parent) "backend"
$Alembic    = Join-Path $BackendDir ".venv\Scripts\alembic.exe"

if (Test-Path $Alembic) {
    Write-Host "`nRunning migrations..." -ForegroundColor Yellow
    Push-Location $BackendDir
    & $Alembic upgrade head
    Pop-Location
    Write-Host "Migrations applied!" -ForegroundColor Green
} else {
    Write-Host "`n.venv not found. Run setup.ps1 first, then re-run this script." -ForegroundColor Yellow
}

Write-Host "`n== Done! Start the backend with: ==" -ForegroundColor Cyan
Write-Host "  cd 02_RevGenIQ_AI_Dashboard\backend" -ForegroundColor White
Write-Host "  .venv\Scripts\uvicorn main:app --reload --port 8000" -ForegroundColor White
