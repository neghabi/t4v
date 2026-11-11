$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$releasesRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot "releases"))
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stagingPath = [System.IO.Path]::GetFullPath((Join-Path $releasesRoot ".staging-$timestamp"))
$archivePath = [System.IO.Path]::GetFullPath((Join-Path $releasesRoot "t4v-deploy-$timestamp.zip"))

if (-not $releasesRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Release path is outside the project."
}
if (-not $stagingPath.StartsWith($releasesRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Staging path is outside the releases directory."
}

New-Item -ItemType Directory -Path $releasesRoot -Force | Out-Null
New-Item -ItemType Directory -Path $stagingPath -Force | Out-Null

try {
  $directories = @("app", "components", "deploy", "lib", "prisma", "public", "scripts")
  foreach ($directory in $directories) {
    $source = Join-Path $projectRoot $directory
    if (Test-Path -LiteralPath $source) {
      Copy-Item -LiteralPath $source -Destination $stagingPath -Recurse
    }
  }

  $files = @(
    ".dockerignore",
    ".env.example",
    ".gitignore",
    "AGENTS.md",
    "docker-compose.yml",
    "docker-compose.production.yml",
    "Dockerfile",
    "eslint.config.mjs",
    "next-env.d.ts",
    "next.config.ts",
    "package.json",
    "package-lock.json",
    "postcss.config.mjs",
    "prisma.config.ts",
    "README.md",
    "tsconfig.json"
  )
  foreach ($file in $files) {
    $source = Join-Path $projectRoot $file
    if (Test-Path -LiteralPath $source) {
      Copy-Item -LiteralPath $source -Destination $stagingPath
    }
  }

  Compress-Archive -Path (Join-Path $stagingPath "*") -DestinationPath $archivePath -CompressionLevel Optimal
  $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath "$archivePath.sha256" -Value "$hash  $(Split-Path -Leaf $archivePath)" -Encoding ascii

  Write-Host "Deployment package created:" -ForegroundColor Green
  Write-Host $archivePath
  Write-Host "SHA256: $hash"
  Write-Host ""
  Write-Host "Upload the ZIP, extract it, then run:" -ForegroundColor Cyan
  Write-Host "chmod +x deploy/install.sh && sudo ./deploy/install.sh t4v.ir"
} finally {
  if (
    (Test-Path -LiteralPath $stagingPath) -and
    $stagingPath.StartsWith($releasesRoot, [System.StringComparison]::OrdinalIgnoreCase)
  ) {
    Remove-Item -LiteralPath $stagingPath -Recurse -Force
  }
}
