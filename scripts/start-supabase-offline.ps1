[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$cliPath = Join-Path $projectRoot 'node_modules/.bin/supabase.cmd'

& (Join-Path $PSScriptRoot 'check-supabase-offline.ps1')
if ($LASTEXITCODE -ne 0) {
    throw 'Prérequis hors ligne incomplets. Corrigez les éléments [KO] avant de démarrer Supabase.'
}

& $cliPath start
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $cliPath status
exit $LASTEXITCODE
