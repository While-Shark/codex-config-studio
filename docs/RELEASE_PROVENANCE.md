# Release artifact provenance

Codex Config Studio creates GitHub artifact attestations for the final files published by the formal `Release` workflow.

This is a third release-security layer, separate from platform signing and Tauri updater signing:

1. **Platform signing**
   - Windows: optional Authenticode.
   - macOS: optional Developer ID + notarization.
   - Linux standalone AppImage/deb do not have one universal OS publisher-trust mechanism equivalent to those two.
2. **Tauri updater signing**
   - Protects in-app update artifacts on every supported desktop platform.
3. **GitHub artifact attestation**
   - Records verifiable build provenance for every final release file produced by this repository's Release workflow.

The attestation covers the files in `release-files/*` after artifacts have been collected and the updater manifest/checksum files have been created.

## Verify a downloaded release

Install or update GitHub CLI, authenticate if necessary, then run:

```bash
gh attestation verify ./Codex.Config.Studio_0.5.0_amd64.AppImage \
  --repo While-Shark/codex-config-studio
```

Use the same command for the Windows installer, macOS DMG, Linux deb, updater signature files, `latest.json`, or `SHA256SUMS.txt`.

A successful verification proves that the file matches an attestation issued for this repository's GitHub Actions workflow identity. It does not replace platform-native signature checks or the Tauri updater signature.

## CI permissions

Only the `publish-release` job receives the extra permissions needed to create attestations:

- `id-token: write`
- `attestations: write`
- `artifact-metadata: write`

The build matrix does not receive these permissions.

The workflow uses `actions/attest@v4` and attests the already collected final release files immediately before the GitHub Release is created or updated.
