#Requires -Version 5.1
<#
.SYNOPSIS
  Envoie un fichier .env (ex. .env.local) vers un projet Vercel lie (apps/web/.vercel).

.DESCRIPTION
  - Une ligne = une variable : KEY=valeur (la premiere liaison = delimite KEY et valeur).
  - Ignore lignes vides et commentaires (#...).
  - Optionnellement prefixe UNIX : export KEY=value
  - Valeurs avec guillemets entourants "(...)" sont dequottees (echappement rudimentaire "").
  - Ne convient PAS aux valeurs multi-lignes complexes.

.PARAMETER EnvFile
  Chemin du fichier env (defaut : .env.local a la racine du repo).

.PARAMETER Targets
  Cibles Vercel : production | preview | development (defaut : production et preview).

.PARAMETER VercelAppDir
  Dossier du projet lie (doit contenir .vercel). Defaut : apps/web.

.PARAMETER SkipKeys
  Noms exacts de variables a ne pas pousser (ex. jeton OIDC local).

.PARAMETER PreviewGitBranch
  Branche Preview a cibler (ex: main). Si vide, la cible Preview "all branches" est tentee.

.EXAMPLE
  cd c:\Novakou
  powershell -ExecutionPolicy Bypass -File .\scripts\push-env-to-vercel.ps1 -DryRun

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\push-env-to-vercel.ps1 `
    -Targets production,preview,development

.NOTES
  Prerequis : `vercel link` depuis apps/web, CLI connecte (`vercel login`).
  Secrets : la valeur transite dans le process CLI ; fermez les traces et surveillez l historique shell.

#>

param(
  [Parameter(Mandatory = $false)]
  [string] $EnvFile,

  [Parameter(Mandatory = $false)]
  [string[]] $Targets = @('production', 'preview'),

  [Parameter(Mandatory = $false)]
  [string] $VercelAppDir,

  [Parameter(Mandatory = $false)]
  [string[]] $SkipKeys = @('VERCEL_OIDC_TOKEN'),

  [Parameter(Mandatory = $false)]
  [string] $PreviewGitBranch = '',

  [Parameter(Mandatory = $false)]
  [switch] $SkipEmptyValues = $true,

  [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$allowedTargets = @('production', 'preview', 'development')

function Unquote-EnvValue {
  param([string] $Raw)
  $v = $Raw
  if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
    $inner = $v.Substring(1, $v.Length - 2)
    return $inner.Replace('\"', '"').Replace('\n', "`n").Replace('\r', "`r")
  }
  if ($v.Length -ge 2 -and $v.StartsWith("'") -and $v.EndsWith("'")) {
    return $v.Substring(1, $v.Length - 2).Replace("''", "'")
  }
  return $v.TrimEnd("`r").Trim()
}

$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $EnvFile) {
  $EnvFile = Join-Path $repoRoot '.env.local'
}
if (-not $VercelAppDir) {
  $VercelAppDir = Join-Path $repoRoot 'apps\web'
}

$vercelMarker = Join-Path $VercelAppDir '.vercel\project.json'
if (-not (Test-Path -LiteralPath $EnvFile)) {
  Write-Error "Fichier introuvable : $EnvFile"
  exit 2
}
if (-not (Test-Path -LiteralPath $vercelMarker)) {
  Write-Warning "Aucun fichier .vercel/project.json sous : $VercelAppDir"
  Write-Warning "Lance depuis apps/web : vercel link"
}
foreach ($t in $Targets) {
  $expandedTargets = @()
  foreach ($piece in ($t -split ',')) {
    $trimmed = $piece.Trim()
    if ($trimmed -ne '') { $expandedTargets += $trimmed }
  }
  if ($expandedTargets.Count -eq 0) { continue }
  foreach ($et in $expandedTargets) {
    if ($allowedTargets -notcontains $et) {
      Write-Error "Target invalide: '$et'. Utiliser uniquement: production, preview, development."
      exit 2
    }
  }
}
$Targets = @(
  foreach ($t in $Targets) {
    foreach ($piece in ($t -split ',')) {
      $trimmed = $piece.Trim()
      if ($trimmed -ne '') { $trimmed }
    }
  }
)

$lines = Get-Content -LiteralPath $EnvFile -Encoding UTF8
$operationsOk = 0
$operationsFail = 0
$i = 0
$seenKeys = @{}

Push-Location -LiteralPath $VercelAppDir
try {
  foreach ($raw in $lines) {
    $i++
    $line = $raw.Trim()
    if ($line -eq '') { continue }
    if ($line.StartsWith('#')) { continue }

    if ($line -match '^(?i)export\s+(.+)$') {
      $line = $Matches[1].Trim()
    }

    $eq = $line.IndexOf('=')
    if ($eq -lt 1) {
      Write-Warning "Ligne $i ignoree (pas de =) : $raw"
      continue
    }

    $key = $line.Substring(0, $eq).Trim()
    if ($key -match '\s') {
      Write-Warning "Cle invalide (espaces), ligne $i : $key"
      continue
    }
    if ($seenKeys.ContainsKey($key)) {
      Write-Host "[skip-duplicate] $key (ligne $i)"
      continue
    }
    $seenKeys[$key] = $true

    $valueRaw = $line.Substring($eq + 1)
    $value = Unquote-EnvValue -Raw $valueRaw

    if ($SkipKeys -contains $key) {
      Write-Host "[skip] $key"
      continue
    }
    if ($SkipEmptyValues -and [string]::IsNullOrWhiteSpace($value)) {
      Write-Host "[skip-empty] $key"
      continue
    }

    foreach ($envTarget in $Targets) {
      if ($DryRun) {
        $preview = ''
        if ($null -ne $value -and $value.Length -gt 0) {
          $n = [Math]::Min(6, $value.Length)
          $preview = ($value.Substring(0, $n) + ($(if ($value.Length -gt $n) { '...' } else { '' })))
        }
        Write-Host "[dry-run] $envTarget  $key  =  $preview"
        continue
      }

      $argList = @('env', 'add', $key, $envTarget)
      if ($envTarget -eq 'preview' -and -not [string]::IsNullOrWhiteSpace($PreviewGitBranch)) {
        $argList += $PreviewGitBranch
      }
      $argList += @(
        '--value', $value,
        '--yes', '--force', '--non-interactive'
      )
      & vercel @argList
      if ($LASTEXITCODE -eq 0) {
        $operationsOk++
      }
      else {
        $operationsFail++
        Write-Warning "Echec vercel env add : $key ($envTarget) exit $LASTEXITCODE"
      }
    }
  }
}
finally {
  Pop-Location
}

Write-Host "---"
Write-Host "Reussites : $operationsOk  |  Echecs : $operationsFail"
if ($DryRun) {
  Write-Host "Mode dry-run : aucune valeur envoyee."
}
exit $(if ($operationsFail -gt 0) { 1 } else { 0 })
