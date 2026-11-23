param(
    [int]$Port = 8765,
    [string]$HostAddress = "127.0.0.1",
    [switch]$SkipFrontendBuild
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$EnvFile = Join-Path $BackendDir ".env"
$EnvExample = Join-Path $BackendDir ".env.example"

Write-Host "=== ModelArena Launcher ===" -ForegroundColor Green

if (-not (Test-Path $VenvPython)) {
    Write-Host "[1/3] Criando virtualenv Python em backend/.venv..." -ForegroundColor Cyan
    python -m venv (Join-Path $BackendDir ".venv")
    & $VenvPython -m pip install --upgrade pip
    & $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")
}

if (-not (Test-Path $EnvFile)) {
    Copy-Item $EnvExample $EnvFile
    Write-Host "[!] Criado backend/.env a partir de .env.example." -ForegroundColor Yellow
}

$envContent = Get-Content $EnvFile -Raw -ErrorAction SilentlyContinue
if (-not ($envContent -match "NVIDIA_API_KEY=\S+") -and -not $env:NVIDIA_API_KEY) {
    Write-Host "[!] Aviso: NVIDIA_API_KEY ainda nao configurada em backend/.env (nem na variavel de ambiente)." -ForegroundColor Yellow
    Write-Host "    Edite $EnvFile e informe sua chave NVIDIA NIM antes de rodar benchmarks." -ForegroundColor Yellow
}

$FrontendDist = Join-Path $FrontendDir "dist\index.html"
if (-not $SkipFrontendBuild -and -not (Test-Path $FrontendDist)) {
    Write-Host "[2/3] Compilando dashboard web em frontend/dist..." -ForegroundColor Cyan
    Push-Location $FrontendDir
    try {
        if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
            npm install
        }
        npm run build
    } finally {
        Pop-Location
    }
}

Write-Host "[3/3] Iniciando ModelArena em http://${HostAddress}:${Port}" -ForegroundColor Green
Write-Host "      Dashboard Web : http://${HostAddress}:${Port}/" -ForegroundColor Gray
Write-Host "      API Swagger   : http://${HostAddress}:${Port}/docs" -ForegroundColor Gray
Write-Host "      OpenChamber   : Settings -> Extensions -> Model Arena" -ForegroundColor Gray

Push-Location $BackendDir
try {
    & $VenvPython -m uvicorn app.main:app --host $HostAddress --port $Port
} finally {
    Pop-Location
}
