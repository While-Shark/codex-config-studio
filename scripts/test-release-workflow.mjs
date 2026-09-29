import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(resolve(root, '.github/workflows/release.yml'), 'utf8');

test('release workflow keeps Apple platform signing optional but rejects partial configuration', () => {
  assert.match(workflow, /Prepare optional macOS Developer ID signing/);
  assert.match(workflow, /REQUIRE_MACOS_SIGNING/);
  assert.match(workflow, /REQUIRE_MACOS_SIGNING=true but Apple Developer signing\/notarization secrets are not configured/);
  assert.match(workflow, /APPLE_PLATFORM_SIGNING_ENABLED=false/);
  assert.match(workflow, /Apple Developer signing\/notarization is not configured; macOS artifacts remain unsigned/);
  assert.match(workflow, /APPLE_CERTIFICATE and APPLE_CERTIFICATE_PASSWORD must both be configured/);
  assert.match(workflow, /Developer ID signing is configured but notarization credentials are missing/);
});

test('release workflow supports both documented notarization credential groups', () => {
  for (const secret of ['APPLE_API_KEY','APPLE_API_ISSUER','APPLE_API_KEY_CONTENT']) {
    assert.ok(workflow.includes(secret), secret + ' is missing from the release workflow');
  }
  for (const secret of ['APPLE_ID','APPLE_PASSWORD','APPLE_TEAM_ID']) {
    assert.ok(workflow.includes(secret), secret + ' is missing from the release workflow');
  }
  assert.match(workflow, /App Store Connect notarization requires APPLE_API_KEY, APPLE_API_ISSUER, and APPLE_API_KEY_CONTENT together/);
  assert.match(workflow, /Apple ID notarization requires APPLE_ID, APPLE_PASSWORD, and APPLE_TEAM_ID together/);
});

test('Apple notarization secrets are scoped to the macOS matrix build', () => {
  for (const secret of ['APPLE_API_KEY','APPLE_API_ISSUER','APPLE_ID','APPLE_PASSWORD','APPLE_TEAM_ID']) {
    assert.ok(
      workflow.includes(`matrix.name == 'macos-universal' && secrets.${secret} || ''`),
      secret + ' should only be exposed to the macOS bundle step',
    );
  }
});

test('release workflow verifies signed macOS apps and always cleans temporary signing material', () => {
  assert.match(workflow, /codesign --verify --deep --strict/);
  assert.match(workflow, /Authority=Developer ID Application:/);
  assert.match(workflow, /spctl --assess --type execute/);
  assert.match(workflow, /xcrun stapler validate "\$app_path"/);
  assert.match(workflow, /Cleanup macOS signing material/);
  assert.match(workflow, /if: always\(\) && matrix\.name == 'macos-universal'/);
  assert.match(workflow, /security delete-keychain/);
  assert.match(workflow, /AuthKey_\*\.p8/);
});


test('release workflow keeps Windows Authenticode optional but rejects partial or untimestamped configuration', () => {
  assert.match(workflow, /Prepare optional Windows Authenticode signing/);
  assert.match(workflow, /REQUIRE_WINDOWS_SIGNING/);
  assert.match(workflow, /REQUIRE_WINDOWS_SIGNING=true but Windows Authenticode signing secrets are not configured/);
  assert.match(workflow, /WINDOWS_PLATFORM_SIGNING_ENABLED=false/);
  assert.match(workflow, /WINDOWS_CERTIFICATE and WINDOWS_CERTIFICATE_PASSWORD must both be configured/);
  assert.match(workflow, /WINDOWS_TIMESTAMP_URL must be configured when Windows Authenticode signing is enabled/);
});

test('Windows signing derives Tauri config from the imported code-signing certificate', () => {
  assert.match(workflow, /Import-PfxCertificate/);
  assert.match(workflow, /1\.3\.6\.1\.5\.5\.7\.3\.3/);
  assert.match(workflow, /certificateThumbprint = \$thumbprint/);
  assert.match(workflow, /digestAlgorithm = 'sha256'/);
  assert.match(workflow, /timestampUrl = \$env:WINDOWS_TIMESTAMP_URL/);
  assert.match(workflow, /TAURI_CONFIG=\$windowsConfig/);
});

test('release workflow verifies and cleans Windows Authenticode signing material', () => {
  assert.match(workflow, /Verify Windows Authenticode signature/);
  assert.match(workflow, /Get-AuthenticodeSignature/);
  assert.match(workflow, /signature\.Status -ne 'Valid'/);
  assert.match(workflow, /signature\.SignerCertificate\.Thumbprint -ne \$env:WINDOWS_SIGNING_THUMBPRINT/);
  assert.match(workflow, /signature\.TimeStamperCertificate/);
  assert.match(workflow, /Cleanup Windows signing material/);
  assert.match(workflow, /if: always\(\) && matrix\.name == 'windows-x64'/);
  assert.ok(workflow.includes('Remove-Item "Cert:\\CurrentUser\\My\\$thumbprint"'));
  assert.match(workflow, /codex-config-studio-signing\.pfx/);
});


test('publish job grants only the permissions required for GitHub artifact attestations', () => {
  assert.match(workflow, /publish:[\s\S]*permissions:[\s\S]*contents: write/);
  assert.match(workflow, /publish:[\s\S]*id-token: write/);
  assert.match(workflow, /publish:[\s\S]*attestations: write/);
  assert.match(workflow, /publish:[\s\S]*artifact-metadata: write/);
});

test('release workflow attests the final collected release files before publishing', () => {
  assert.match(workflow, /Attest release build provenance/);
  assert.match(workflow, /uses: actions\/attest@v4/);
  assert.match(workflow, /subject-path: release-files\/\*/);
  const collect = workflow.indexOf('Collect release files and checksums');
  const attest = workflow.indexOf('Attest release build provenance');
  const publish = workflow.indexOf('Create or update GitHub Release');
  assert.ok(collect >= 0 && attest > collect && publish > attest, 'attestation must cover final release files before publishing');
});


test('formal release validates a complete artifact set before manifest and attestation', () => {
  assert.match(workflow, /node scripts\/verify-release-files\.mjs release-files/);
  const verify = workflow.indexOf('node scripts/verify-release-files.mjs release-files');
  const manifest = workflow.indexOf('node scripts/build-updater-manifest.mjs release-files');
  const attest = workflow.indexOf('Attest release build provenance');
  assert.ok(verify >= 0 && manifest > verify && attest > manifest, 'artifact integrity must be checked before manifest generation and attestation');
});
