# macOS Developer ID signing and notarization

Codex Config Studio uses two independent signing layers:

1. **Tauri updater signing** protects the in-app update artifacts on every supported desktop platform.
2. **Apple Developer ID signing + notarization** establishes macOS publisher identity and allows Gatekeeper to verify direct-download builds.

They are intentionally configured separately. A valid Tauri updater signature does not replace Apple code signing, and Apple notarization does not replace the updater signature.

## Release behavior

The formal `Release` workflow has three macOS states:

- **No Apple secrets configured**: macOS continues to build as an unsigned artifact, matching the existing behavior.
- **A complete Apple signing configuration is present**: the workflow imports a Developer ID Application certificate into a temporary keychain, lets Tauri sign and notarize the app, verifies the resulting app, then deletes temporary signing material.
- **Only part of the Apple configuration is present**: the macOS release job fails before packaging. This prevents accidentally publishing a half-configured build that looks signed but is not correctly notarized.

Nightly builds do not require Apple Developer credentials.

## Required GitHub Actions secrets

### Developer ID certificate

Both are required when Apple platform signing is enabled:

| Secret | Value |
| --- | --- |
| `APPLE_CERTIFICATE` | Base64-encoded Developer ID Application `.p12` certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |

Create the Base64 value on macOS with:

```bash
openssl base64 -A -in DeveloperIDApplication.p12 -out DeveloperIDApplication.base64.txt
```

Do not commit the certificate, Base64 output, or password to the repository.

### Notarization option A: App Store Connect API key

Configure all three:

| Secret | Value |
| --- | --- |
| `APPLE_API_KEY` | App Store Connect API Key ID |
| `APPLE_API_ISSUER` | App Store Connect Issuer ID |
| `APPLE_API_KEY_CONTENT` | Full contents of the downloaded `AuthKey_<KEY_ID>.p8` file |

This is the preferred CI option because it avoids storing an Apple account password. The workflow writes the key to a temporary file only for the build and removes it afterward.

### Notarization option B: Apple ID

If an API key is not used, configure all three:

| Secret | Value |
| --- | --- |
| `APPLE_ID` | Apple account email |
| `APPLE_PASSWORD` | Apple app-specific password |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

Do not configure a partial API-key or Apple-ID group.

## Verification performed by CI

When Apple platform signing is enabled, the release job requires all of these checks to pass:

```text
codesign --verify --deep --strict
Developer ID Application authority present
spctl --assess --type execute
xcrun stapler validate <app>
```

The workflow then uploads the normal Universal macOS DMG/app updater artifacts. The temporary keychain, imported certificate file, and temporary App Store Connect key file are removed with an `always()` cleanup step.

## GitHub configuration

Add secrets under:

`Repository Settings -> Secrets and variables -> Actions`

Do not place Apple signing values in repository variables, workflow YAML, `.env` files, or Tauri configuration files.

## First notarization

Tauri normally waits for Apple notarization and staples the accepted ticket to the app. The first notarization for a new app or account can take longer than later builds. The release workflow deliberately does not use `--skip-stapling`, because public release artifacts should pass offline Gatekeeper verification after the build completes.
