import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(resolve(root, '.github/workflows/release.yml'), 'utf8');

test('release workflow keeps Apple platform signing optional but rejects partial configuration', () => {
  assert.match(workflow, /Prepare optional macOS Developer ID signing/);
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
