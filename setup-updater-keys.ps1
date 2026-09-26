param(
  [string]$Repository = "While-Shark/codex-config-studio",
  [string]$KeyPath = "$HOME\.tauri\codex-config-studio.key",
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $KeyPath
New-Item -ItemType Directory -Force -Path $dir | Out-Null

if ((Test-Path $KeyPath) -or (Test-Path "$KeyPath.pub")) {
  throw "Key already exists at $KeyPath. Refusing to overwrite it."
}

if ($Password.Length -gt 0) {
  npm run tauri signer generate -- --ci -p $Password -w $KeyPath
} else {
  npm run tauri signer generate -- --ci -w $KeyPath
}

$pubPath = "$KeyPath.pub"
if (!(Test-Path $pubPath)) { throw "Public key was not created at $pubPath" }

$pub = (Get-Content -Raw $pubPath).Trim()
$private = (Get-Content -Raw $KeyPath).Trim()

if (Get-Command gh -ErrorAction SilentlyContinue) {
  $private | gh secret set TAURI_SIGNING_PRIVATE_KEY --repo $Repository
  gh secret set TAURI_UPDATER_PUBKEY --repo $Repository --body $pub
  if ($Password.Length -gt 0) {
    gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --repo $Repository --body $Password
  }
  Write-Host "GitHub updater secrets configured for $Repository."
} else {
  Write-Host "GitHub CLI was not found. Add these repository secrets manually:"
  Write-Host "  TAURI_SIGNING_PRIVATE_KEY = contents of $KeyPath"
  Write-Host "  TAURI_UPDATER_PUBKEY      = contents of $pubPath"
  if ($Password.Length -gt 0) {
    Write-Host "  TAURI_SIGNING_PRIVATE_KEY_PASSWORD = the password passed to this script"
  }
}

Write-Host ""
Write-Host "IMPORTANT: Back up $KeyPath securely. Losing the private key prevents future in-place updates."
Write-Host "Public key: $pub"
