$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Ensure-Cargo {
    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        $cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
        if (Test-Path (Join-Path $cargoBin "cargo.exe")) {
            $env:Path = "$cargoBin;$env:Path"
        }
    }

    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "Rust/Cargo was not found." -ForegroundColor Red
        Write-Host "Install Rust with:" -ForegroundColor Yellow
        Write-Host "  winget install --id Rustlang.Rustup" -ForegroundColor Cyan
        Write-Host "Then restart PowerShell and run:" -ForegroundColor Yellow
        Write-Host "  rustup default stable-msvc" -ForegroundColor Cyan
        Write-Host "  cargo --version" -ForegroundColor Cyan
        exit 1
    }
}

function Assert-LastExitCode([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE."
    }
}

Ensure-Cargo

npm install
Assert-LastExitCode "npm install"

npm run tauri:build -- --bundles nsis
Assert-LastExitCode "Tauri build"

Write-Host ""
Write-Host "Build succeeded." -ForegroundColor Green
Write-Host "Installer output: src-tauri\target\release\bundle\nsis" -ForegroundColor Green
