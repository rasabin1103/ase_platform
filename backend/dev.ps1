$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$name' en PATH. Instálalo o añade a PATH y reintenta."
  }
}

function Stop-ProcessOnPort([int]$Port) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
  } catch {
    return
  }

  foreach ($c in $conns) {
    if ($null -ne $c.OwningProcess -and $c.OwningProcess -gt 0) {
      try {
        $p = Get-Process -Id $c.OwningProcess -ErrorAction Stop
        Write-Host "Puerto $Port ocupado por PID $($p.Id) ($($p.ProcessName)). Terminando..." -ForegroundColor Yellow
        Stop-Process -Id $p.Id -Force -ErrorAction Stop
      } catch {
        Write-Host "No se pudo terminar el proceso en puerto $Port (PID $($c.OwningProcess))." -ForegroundColor DarkYellow
      }
    }
  }
}

Write-Host "== ASE Backend (fase 1) ==" -ForegroundColor Cyan

Assert-Command python
Assert-Command docker

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

# Use DATABASE_URL from backend/.env only (ignore stale shell variables)
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue

if (-not (Test-Path ".\.venv")) {
  Write-Host "Creando venv en .venv..." -ForegroundColor Yellow
  python -m venv .venv
}

Write-Host "Activando venv..." -ForegroundColor Yellow
. .\.venv\Scripts\Activate.ps1

Write-Host "Instalando dependencias..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

Write-Host "Levantando PostgreSQL + pgAdmin (Docker Compose)..." -ForegroundColor Yellow
docker compose up -d

Stop-ProcessOnPort 8000

Write-Host "Arrancando FastAPI (Uvicorn) en http://127.0.0.1:8000 ..." -ForegroundColor Green
Write-Host "Para detener: CTRL+C" -ForegroundColor DarkGray
python -m uvicorn app.main:app --reload --port 8000

