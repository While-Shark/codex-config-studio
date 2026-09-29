# Windows Authenticode signing

Codex Config Studio uses two independent signing layers on Windows:

1. **Tauri updater signing** protects the update artifact consumed by the in-app updater.
2. **Windows Authenticode signing** identifies the publisher of the executable/installer to Windows and supports SmartScreen reputation.

A Tauri updater signature does not replace Authenticode.

## Release behavior

The formal `Release` workflow has three Windows states:

- **No Windows signing secrets configured**: Windows keeps the existing unsigned NSIS build behavior.
- **Complete Authenticode configuration**: the workflow imports the PFX into the current-user certificate store, derives its thumbprint at build time, passes a temporary `TAURI_CONFIG` overlay to Tauri, verifies the resulting NSIS installer, and removes the imported certificate afterward.
- **Partial signing configuration**: the Windows release job fails before packaging.

Nightly builds do not require a Windows signing certificate.

After one signed formal release has succeeded, set the repository Actions variable `REQUIRE_WINDOWS_SIGNING=true`. Future formal releases then fail if the PFX secrets are missing rather than silently returning to unsigned installers.

## Required GitHub Actions secrets

Configure both under:

`Repository Settings -> Secrets and variables -> Actions -> Secrets`

| Secret | Value |
| --- | --- |
| `WINDOWS_CERTIFICATE` | Base64-encoded code-signing `.pfx` |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password used to export the PFX |

The PFX must contain a private key and a certificate with the Code Signing enhanced key usage OID `1.3.6.1.5.5.7.3.3`.

A PowerShell example for Base64 encoding:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("certificate.pfx")
) | Set-Content -NoNewline certificate.pfx.base64.txt
```

Do not commit the PFX, Base64 value, or password.

## Required repository variable for signed builds

Configure:

`Repository Settings -> Secrets and variables -> Actions -> Variables`

| Variable | Value |
| --- | --- |
| `WINDOWS_TIMESTAMP_URL` | Timestamp server URL supplied/recommended by the signing provider |

A timestamp is required by the workflow. Without one, a signature can become unusable after the signing certificate expires.

Optional variables:

| Variable | Value |
| --- | --- |
| `WINDOWS_TSP` | `true` if the timestamp endpoint uses RFC 3161/TSP; otherwise leave unset/false |
| `REQUIRE_WINDOWS_SIGNING` | Set to `true` only after the signed release path has been proven |

Use the timestamp protocol documented by your certificate/signing provider; do not guess the `WINDOWS_TSP` value.

## What CI validates before publishing

When Authenticode is enabled, the workflow requires the NSIS installer to pass all of these checks:

- PowerShell `Get-AuthenticodeSignature` reports `Valid`.
- The signer thumbprint matches the PFX imported for this build.
- A timestamp certificate is present.

The certificate thumbprint is never committed to the repository. It is derived on every release, which makes certificate renewal possible without a source-code change.

## Temporary material and cleanup

The workflow writes the decoded PFX only under the GitHub runner temporary directory. After artifact upload, an `always()` cleanup step:

- removes every certificate imported from that PFX from `Cert:\CurrentUser\My`;
- removes the temporary PFX file.

The PFX secrets are only exposed to the Windows preparation step, not to Linux or macOS build processes.

## Certificate choices

Current Windows code-signing certificate issuance rules vary by certificate authority and can require hardware-backed or cloud-held keys. The PFX flow documented here is appropriate only when your provider gives you an exportable PFX suitable for CI.

If your certificate is non-exportable or cloud-backed, use Tauri's `bundle.windows.signCommand` integration with the provider's signing service instead (for example Azure Artifact Signing/Key Vault). Do not export or weaken a hardware/cloud-protected key merely to fit the PFX path.
