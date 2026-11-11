$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
  docker compose logs --follow --tail 200 app db
} finally {
  Pop-Location
}
