import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(resolve(root, '.github/workflows/release.yml'), 'utf8').replace(/\r\n/g, '\n');
const releaseTriggerWorkflow = readFileSync(resolve(root, '.github/workflows/release-trigger.yml'), 'utf8').replace(/\r\n/g, '\n');
const updaterRust = readFileSync(resolve(root, 'src-tauri/src/updater.rs'), 'utf8').replace(/\r\n/g, '\n');
const updaterPrepare = readFileSync(resolve(root, 'scripts/prepare-updater-build.mjs'), 'utf8').replace(/\r\n/g, '\n');
const tauriConfig = JSON.parse(readFileSync(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8'));

test('required updater secrets are validated before release version mutation', () => {
  const check=workflow.indexOf('Verify required updater signing secrets before release mutation');
  const privateKey=workflow.indexOf('Missing TAURI_SIGNING_PRIVATE_KEY; refusing to bump the release version.');
  const publicKey=workflow.indexOf('Missing TAURI_UPDATER_PUBKEY; refusing to bump the release version.');
  const bump=workflow.indexOf('Prepare automatic version bump');
  const commit=workflow.indexOf('Commit release version');
  assert.ok(check>=0&&privateKey>check&&publicKey>check,'updater secret preflight is missing');
  assert.ok(bump>check&&commit>bump,'required updater secrets must be checked before bump/push');
});

test('release verifies version consistency before any automatic bump', () => {
  const verify=workflow.indexOf('Verify release version sources');
  const command=workflow.indexOf('node scripts/check-release-version.mjs');
  const bump=workflow.indexOf('Prepare automatic version bump');
  assert.ok(verify>=0&&command>verify&&bump>command,'version preflight must run before automatic bump');
});

test('release workflow keeps Apple platform signing optional but rejects partial configuration', () => {
  assert.match(workflow, /Prepare optional macOS Developer ID signing/);
  assert.match(workflow, /REQUIRE_MACOS_SIGNING/);
  assert.match(workflow, /REQUIRE_MACOS_SIGNING=true but Apple Developer signing\/notarization secrets are not configured/);
  assert.doesNotMatch(workflow, /\$\{REQUIRE_MACOS_SIGNING,,\}/);
  assert.match(workflow, /tr '\[:upper:\]' '\[:lower:\]'/);
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


test('release workflow follows least-privilege token permissions', () => {
  assert.match(workflow, /^permissions:\n  contents: read/m);
  const prepareStart = workflow.indexOf('  prepare:');
  const buildStart = workflow.indexOf('  build:');
  const publishStart = workflow.indexOf('  publish:');
  assert.ok(prepareStart >= 0 && buildStart > prepareStart && publishStart > buildStart);
  const prepare = workflow.slice(prepareStart, buildStart);
  const build = workflow.slice(buildStart, publishStart);
  const publish = workflow.slice(publishStart);
  assert.match(prepare, /permissions:\n      contents: write/);
  assert.match(build, /permissions:\n      contents: read/);
  assert.doesNotMatch(build, /contents: write/);
  assert.match(publish, /permissions:[\s\S]*contents: write/);
});

test('tag-driven releases must point to a commit reachable from master', () => {
  assert.match(workflow, /git fetch origin master --no-tags/);
  assert.match(workflow, /git merge-base --is-ancestor "\$commit_sha" origin\/master/);
  assert.match(workflow, /Release commit \$commit_sha is not reachable from origin\/master/);
});


test('formal release embeds updater trust while local builds stay disabled by default', () => {
  assert.equal(tauriConfig.plugins?.updater?.pubkey, '');
  assert.match(updaterRust, /option_env!\("CODEX_UPDATER_PUBKEY"\)/);
  assert.match(updaterRust, /builder\.pubkey\(pubkey\)\.build\(\)/);
  assert.match(updaterRust, /Signed updater is not enabled in this build/);
  assert.match(updaterPrepare, /CODEX_UPDATER_PUBKEY is required for signed release builds/);
  assert.match(updaterPrepare, /TAURI_SIGNING_PRIVATE_KEY is required for signed release builds/);
  assert.match(updaterPrepare, /normalizeUpdaterPublicKey/);
  assert.match(updaterPrepare, /GITHUB_ENV/);
  assert.match(updaterPrepare, /TAURI_UPDATER_PUBKEY=\$\{pubkey\}/);
  assert.match(updaterPrepare, /createUpdaterArtifacts=true|createUpdaterArtifacts:true/);
  const rawMappings=workflow.match(/CODEX_UPDATER_PUBKEY: \$\{\{ secrets\.TAURI_UPDATER_PUBKEY \}\}/g)??[];
  assert.equal(rawMappings.length,3,'raw updater public key should only be read by preflight/validation/materialization steps');
  assert.doesNotMatch(workflow, /Build desktop bundle[\s\S]{0,500}CODEX_UPDATER_PUBKEY: \$\{\{ secrets\.TAURI_UPDATER_PUBKEY \}\}/);
  assert.match(workflow, /TAURI_SIGNING_PRIVATE_KEY: \$\{\{ secrets\.TAURI_SIGNING_PRIVATE_KEY \}\}/);
  assert.doesNotMatch(workflow, /^\s*TAURI_UPDATER_PUBKEY:/m);
});


test('release trigger branch uses a secretless relay with a narrow path filter', () => {
  assert.match(releaseTriggerWorkflow, /branches:\n      - release-trigger/);
  assert.match(releaseTriggerWorkflow, /paths:\n      - "\.release-trigger\/request\.txt"/);
  assert.match(releaseTriggerWorkflow, /permissions:\n  contents: read\n  actions: write/);
  assert.doesNotMatch(releaseTriggerWorkflow, /secrets\./);
  assert.match(releaseTriggerWorkflow, /release-trigger commits must use exactly: release: patch, release: minor, release: major, or release: current/);
  assert.match(releaseTriggerWorkflow, /"release: patch"\) bump="patch"/);
  assert.match(releaseTriggerWorkflow, /"release: minor"\) bump="minor"/);
  assert.match(releaseTriggerWorkflow, /"release: major"\) bump="major"/);
  assert.match(releaseTriggerWorkflow, /"release: current"\) bump="current"/);
});

test('release trigger relay dispatches the formal workflow from master', () => {
  assert.match(releaseTriggerWorkflow, /gh workflow run release\.yml/);
  assert.match(releaseTriggerWorkflow, /--ref master/);
  assert.match(releaseTriggerWorkflow, /-f bump="\$BUMP"/);
  assert.match(releaseTriggerWorkflow, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.doesNotMatch(workflow, /release-trigger/);
});


test('formal release can retry the already prepared current version without another bump', () => {
  assert.match(workflow, /- current/);
  assert.match(workflow, /if \[ "\$\{\{ inputs\.bump \}\}" = "current" \]; then/);
  assert.match(workflow, /if: github\.event_name == 'workflow_dispatch' && inputs\.bump != 'current'/);
});
