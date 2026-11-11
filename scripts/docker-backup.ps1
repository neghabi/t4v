$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $projectRoot "backups"
$envPath = Join-Path $projectRoot ".env"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw ".env was not found. Run scripts/docker-up.ps1 first."
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupDir "t4v-$stamp.dump"
$containerId = docker compose -f (Join-Path $projectRoot "docker-compose.yml") ps -q db

if ($LASTEXITCODE -ne 0 -or -not $containerId) {
  throw "The database container is not running."
}

$envValues = @{}
Get-Content -LiteralPath $envPath | ForEach-Object {
  if ($_ -match "^([^#=]+)=(.*)$") {
    $envValues[$matches[1]] = $matches[2]
  }
}

$dbUser = $envValues["POSTGRES_USER"]
$dbName = $envValues["POSTGRES_DB"]
$containerBackup = "/tmp/t4v-$stamp.dump"

docker compose -f (Join-Path $projectRoot "docker-compose.yml") exec -T db `
  pg_dump -U $dbUser -d $dbName --format=custom --no-owner --no-privileges `
  --file=$containerBackup
if ($LASTEXITCODE -ne 0) {
  throw "Database backup failed."
}

docker cp "${containerId}:$containerBackup" $backupPath
if ($LASTEXITCODE -ne 0) {
  throw "Copying the database backup failed."
}

docker compose -f (Join-Path $projectRoot "docker-compose.yml") exec -T db `
  rm -f $containerBackup

Write-Host "Backup created: $backupPath" -ForegroundColor Green
