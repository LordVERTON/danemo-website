[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot 'supabase/config.toml'
$manifestPath = Join-Path $projectRoot 'supabase/offline-images.txt'
$cliPath = Join-Path $projectRoot 'node_modules/.bin/supabase.cmd'
$hasFailures = $false

function Write-CheckResult {
    param(
        [Parameter(Mandatory)] [string] $Label,
        [Parameter(Mandatory)] [bool] $Succeeded,
        [string] $Details
    )

    if ($Succeeded) {
        Write-Host "[OK] $Label" -ForegroundColor Green
        if ($Details) { Write-Host "     $Details" -ForegroundColor DarkGray }
        return
    }

    $script:hasFailures = $true
    Write-Host "[KO] $Label" -ForegroundColor Red
    if ($Details) { Write-Host "     $Details" -ForegroundColor Yellow }
}

try {
    $dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
    Write-CheckResult -Label 'Docker Engine' -Succeeded ([bool]$dockerVersion) -Details $dockerVersion
} catch {
    Write-CheckResult -Label 'Docker Engine' -Succeeded $false -Details $_.Exception.Message
}

if (Test-Path -LiteralPath $cliPath) {
    try {
        $cliVersion = & $cliPath --version 2>$null
        Write-CheckResult -Label 'Supabase CLI locale' -Succeeded ([bool]$cliVersion) -Details "version $cliVersion"
    } catch {
        Write-CheckResult -Label 'Supabase CLI locale' -Succeeded $false -Details $_.Exception.Message
    }
} else {
    Write-CheckResult -Label 'Supabase CLI locale' -Succeeded $false -Details "Binaire absent : $cliPath"
}

if ((Test-Path -LiteralPath $configPath) -and (Test-Path -LiteralPath (Join-Path $projectRoot 'supabase'))) {
    Write-CheckResult -Label 'Configuration Supabase' -Succeeded $true -Details 'supabase/config.toml présent'
} else {
    Write-CheckResult -Label 'Configuration Supabase' -Succeeded $false -Details 'supabase/ ou config.toml est absent.'
}

$migrationsPath = Join-Path $projectRoot 'supabase/migrations'
$migrations = @(Get-ChildItem -LiteralPath $migrationsPath -File -Filter '*.sql' -ErrorAction SilentlyContinue)
Write-CheckResult -Label 'Migrations' -Succeeded ($migrations.Count -gt 0) -Details "$($migrations.Count) fichier(s) SQL détecté(s)"

$seedPath = Join-Path $projectRoot 'supabase/seed.sql'
if (Test-Path -LiteralPath $seedPath) {
    Write-CheckResult -Label 'Seed' -Succeeded $true -Details 'supabase/seed.sql présent'
} else {
    Write-CheckResult -Label 'Seed' -Succeeded $false -Details 'Le seed configuré est absent : supabase/seed.sql'
}

if (-not (Test-Path -LiteralPath $manifestPath)) {
    Write-CheckResult -Label 'Images Docker Supabase disponibles' -Succeeded $false -Details 'Manifeste absent : supabase/offline-images.txt'
} else {
    $requiredImages = Get-Content -LiteralPath $manifestPath | Where-Object { $_.Trim() -and -not $_.Trim().StartsWith('#') }
    $missingImages = @()
    foreach ($image in $requiredImages) {
        & docker image inspect $image.Trim() *> $null
        if ($LASTEXITCODE -ne 0) { $missingImages += $image.Trim() }
    }

    if ($missingImages.Count -eq 0) {
        Write-CheckResult -Label 'Images Docker Supabase disponibles' -Succeeded $true -Details "$($requiredImages.Count) image(s) vérifiée(s)"
    } else {
        Write-CheckResult -Label 'Images Docker Supabase disponibles' -Succeeded $false -Details ("Manquantes : " + ($missingImages -join ', '))
    }
}

if ($hasFailures) { exit 1 }
