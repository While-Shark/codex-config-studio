# Signed updater maintenance

Codex Config Studio keeps normal local/Nightly builds independent from updater signing. Only the formal Release workflow requires updater signing secrets.

## One-time key setup

On the maintainer Windows machine, from the repository root:

```powershell
.\setup-updater-keys.ps1
```

The script:

1. refuses to overwrite an existing updater key;
2. stores the private key under `~/.tauri/codex-config-studio.key`;
3. creates the matching public key;
4. when GitHub CLI is available, configures these repository secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   - `TAURI_UPDATER_PUBKEY`

Use `-Password "..." ` if the private key should be password protected.

Back up the private key outside the repository. Never commit it. Losing it breaks the trust chain for already-installed versions.

## Release behavior

The formal Release workflow fails early when signing secrets are missing. This is intentional.

A successful signed release publishes:

- Windows NSIS installer + `.sig`
- Linux AppImage + `.sig`
- Linux deb + `.sig`
- macOS updater `.app.tar.gz` + `.sig`
- `latest.json`
- normal install artifacts and SHA256 checksums

`latest.json` contains installer-specific target keys so AppImage and deb installations receive their matching package.

## Rollout baseline

`v0.5.0` predates the signed updater implementation and does not contain the updater runtime, `latest.json` support, or updater signature verification. It therefore cannot upgrade itself to `v0.6.0` in-app.

Treat `v0.6.0` as the first signed-updater-capable baseline release:

- users on `v0.5.0` or older install `v0.6.0` manually once from GitHub Releases;
- verify that `v0.6.0` detects and installs a later signed test/stable release (for example `v0.6.1`) before declaring the in-app updater rollout fully proven;
- do not use `v0.5.0 -> v0.6.0` as an updater acceptance test, because the source build has no updater code.

## Runtime behavior

- Signed formal builds offer in-app install/restart.
- Unsigned local and Nightly builds keep the stable Release-page fallback.
- The frontend does not receive generic shell or updater permissions; installation is exposed through narrow native commands.
