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

function Test-TcpPortAvailable {
    param([string]$BindHost, [int]$TestPort)
    $listener = $null
    try {
        $ip = [System.Net.IPAddress]::Parse($BindHost)
        $listener = New-Object System.Net.Sockets.TcpListener($ip, $TestPort)
        $listener.Server.ExclusiveAddressUse = $true
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) {
            try { $listener.Stop() } catch {}
        }
    }
}

function Find-FreePort {
    param([string]$BindHost, [int]$PreferredPort)
    $candidates = @($PreferredPort, 8766, 8770, 8865, 8965, 9765, 18765) | Select-Object -Unique
    foreach ($candidate in $candidates) {
        if (Test-TcpPortAvailable -BindHost $BindHost -TestPort $candidate) {
            return $candidate
        }
    }
    # Last resort: ask OS for an ephemeral port
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Parse($BindHost), 0)
    $listener.Start()
    $ephemeral = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    $listener.Stop()
    return $ephemeral
}

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

$OpenCodeBundled = Join-Path $env:LOCALAPPDATA "Programs\@openchamberelectron\resources\opencode-cli\opencode.exe"
$HasOpenCode = (Test-Path $OpenCodeBundled) -or [bool](Get-Command opencode -ErrorAction SilentlyContinue)

$envContent = Get-Content $EnvFile -Raw -ErrorAction SilentlyContinue
$HasApiKey = ($envContent -match "NVIDIA_API_KEY=\S+") -or [bool]$env:NVIDIA_API_KEY

if ($HasOpenCode -and -not $HasApiKey) {
    Write-Host "[OK] OpenChamber / OpenCode CLI detectado — usando provedor console-nvidia SEM precisar de NVIDIA_API_KEY!" -ForegroundColor Green
} elseif (-not $HasOpenCode -and -not $HasApiKey) {
    Write-Host "[!] Aviso: OpenCode CLI nao detectado e NVIDIA_API_KEY nao configurada em backend/.env." -ForegroundColor Yellow
    Write-Host "    Instale o OpenChamber Desktop ou informe NVIDIA_API_KEY em $EnvFile." -ForegroundColor Yellow
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

$SelectedPort = Find-FreePort -BindHost $HostAddress -PreferredPort $Port
if ($SelectedPort -ne $Port) {
    Write-Host "[!] Porta $Port ja esta ocupada ou bloqueada neste Windows. Usando porta livre $SelectedPort automaticamente." -ForegroundColor Yellow
}

$RuntimeDir = Join-Path $env:USERPROFILE ".modelarena"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
$RuntimeInfo = @{
    url       = "http://${HostAddress}:${SelectedPort}"
    host      = $HostAddress
    port      = $SelectedPort
    updatedAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json
[System.IO.File]::WriteAllText(
    (Join-Path $RuntimeDir "runtime.json"),
    $RuntimeInfo,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "[3/3] Iniciando ModelArena em http://${HostAddress}:${SelectedPort}" -ForegroundColor Green
Write-Host "      Dashboard Web : http://${HostAddress}:${SelectedPort}/" -ForegroundColor Gray
Write-Host "      API Swagger   : http://${HostAddress}:${SelectedPort}/docs" -ForegroundColor Gray
Write-Host "      OpenChamber   : Settings -> Extensions -> Model Arena (porta sincronizada automaticamente)" -ForegroundColor Gray

Push-Location $BackendDir
try {
    & $VenvPython -m uvicorn app.main:app --host $HostAddress --port $SelectedPort
} finally {
    Pop-Location
}
