# v0.6.0 release checklist

Use this checklist for the first formal release that includes the signed in-app updater.

## Before dispatch

- `master` is green on the latest Nightly workflow.
- Run `node scripts/check-release-version.mjs`; every release version source must still agree on the current version.
- Confirm `RELEASE_NOTES.md` includes the GPT-6.1 Sol, model-aware Reasoning, client compatibility, usage/cost, release integrity, and updater bootstrap notes.
- The required updater secrets exist:
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_UPDATER_PUBKEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` only when the private key is password protected.
- Back up the updater private key outside the repository. Losing it breaks the trust chain for already-installed signed-updater builds.
- Windows Authenticode and macOS Developer ID/notarization remain optional for this release unless their `REQUIRE_*_SIGNING` policy variables have already been enabled.

If updater keys have not been created yet, run on the maintainer Windows machine:

```powershell
.\setup-updater-keys.ps1
```

The formal Release workflow independently re-checks required updater secrets **before** it mutates or pushes any version number.

## Dispatch v0.6.0

From GitHub Actions, run the **Release** workflow from `master` with:

```text
bump = minor
```

With the current `0.5.0` source version this resolves to `0.6.0`.

The prepare job must:

1. verify all version sources are aligned;
2. verify required updater signing secrets;
3. bump package, lockfile, Tauri, and Cargo versions together;
4. run the full frontend/release regression suite;
5. push the release-version commit to `master`.

If either version consistency or updater-secret validation fails, the workflow must stop **before** the version bump is pushed.

## Build gate

All three build jobs must succeed:

- Windows x64 — NSIS
- Linux x64 — AppImage + deb
- macOS Universal — dmg + app updater archive

The release artifact set must contain exactly one of each required payload/signature pair:

- `*-setup.exe` + `*-setup.exe.sig`
- `*.AppImage` + `*.AppImage.sig`
- `*.deb` + `*.deb.sig`
- `*.dmg`
- `*.app.tar.gz` + `*.app.tar.gz.sig`

Platform signatures are separate from Tauri updater signatures:

- Windows Authenticode is verified when configured.
- macOS Developer ID + notarization is verified when configured.
- Tauri updater signatures are mandatory for the formal release.

## Publish gate

Before the GitHub Release is created or updated, the workflow must produce and validate:

- `latest.json`
- `SHA256SUMS.txt`
- the complete updater payload/signature set
- GitHub artifact attestations for the final release files

After publication, verify a downloaded file can be traced to this repository:

```bash
gh attestation verify <file> --repo While-Shark/codex-config-studio
```

Also confirm that the stable Release is tagged `v0.6.0` and is not marked as a prerelease.

## Updater rollout baseline

`v0.5.0` has no updater runtime, no `latest.json` support, and no updater signature verification. It cannot perform an in-app upgrade to `v0.6.0`.

For the first rollout:

1. users on `v0.5.0` or older install `v0.6.0` manually once from GitHub Releases;
2. install the formal `v0.6.0` build on at least one real machine;
3. make a later signed release (for example `v0.6.1`);
4. verify `v0.6.0` detects, downloads, verifies, installs, and restarts into that later version.

Only after the `v0.6.0 -> later signed release` path succeeds should the signed in-app updater rollout be considered fully proven.

## After release

- Confirm `package.json`, `package-lock.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock` all contain `0.6.0`.
- Confirm the `v0.6.0` tag points to a commit reachable from `master`.
- Confirm the stable update checker reports `v0.6.0` as latest.
- Keep the updater private key backup; do not rotate it casually.
- After platform signing is proven successfully, optionally enable:
  - `REQUIRE_WINDOWS_SIGNING=true`
  - `REQUIRE_MACOS_SIGNING=true`
  so later releases cannot silently fall back to unsigned platform artifacts.
