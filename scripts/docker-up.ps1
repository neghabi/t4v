$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"

function New-HexSecret([int]$byteCount) {
  $bytes = New-Object byte[] $byteCount
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return ([BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
}

if (-not (Test-Path -LiteralPath $envPath)) {
  $dbPassword = New-HexSecret 24
  $appSecret = New-HexSecret 48
  $dashboardSecret = New-HexSecret 12
  $content = @(
    "POSTGRES_USER=t4v"
    "POSTGRES_PASSWORD=$dbPassword"
    "POSTGRES_DB=t4v"
    "DATABASE_URL=postgresql://t4v:$dbPassword@db:5432/t4v?schema=public"
    "APP_SECRET=$appSecret"
    "DASHBOARD_SECRET=$dashboardSecret"
    "APP_DOMAIN=t4v.ir"
    "PUBLIC_SHORT_URL_BASE=http://localhost:3000"
    "COOKIE_SECURE=false"
    "APP_PORT=3000"
  )
  Set-Content -LiteralPath $envPath -Value $content -Encoding utf8
  Write-Host "Secure .env file was generated." -ForegroundColor Green
}

Push-Location $projectRoot
try {
  docker compose up --build -d --wait --wait-timeout 240
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose failed with exit code $LASTEXITCODE. Ensure Docker Desktop is running."
  }
  $dashboardSecretLine = Get-Content -LiteralPath $envPath |
    Where-Object { $_ -like "DASHBOARD_SECRET=*" } |
    Select-Object -First 1
  $dashboardSecret = $dashboardSecretLine -replace "^DASHBOARD_SECRET=", ""

  Write-Host ""
  Write-Host "T4V is ready." -ForegroundColor Green
  Write-Host "Site:            http://localhost:3000"
  Write-Host "Health:          http://localhost:3000/api/health"
  Write-Host "Admin:           http://localhost:3000/admin"
  Write-Host "Admin password:  $dashboardSecret" -ForegroundColor Yellow
} finally {
  Pop-Location
}
