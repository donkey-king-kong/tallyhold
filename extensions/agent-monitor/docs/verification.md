# Verification

Feature 004 release-candidate evidence recorded on 2026-11-17. All fixtures are
synthetic. No private Agent Flow log content is copied into this document or the
package.

## Environment

- Hardware: MacBook Pro `Mac14,10`, Apple M2 Pro, 32 GB memory, arm64
- VS Code: `1.145.3`, commit `dcd3ad6e368fbe19d03f37054a40dbaf40d676f4`
- Trae: application `3.6.13`, VS Code base `1.107.1`, commit
  `9da5f4f95119514cfc3ace561780174ce3193f23`
- Candidate API floor: `^1.80.0`
- Type declarations are pinned to `@types/vscode 1.80.0`

## Automated Checks

| Check                              | Result                                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| `npm ci`                           | PASS; locked install completed                                     |
| `npm run lint`                     | PASS                                                               |
| `npm run format:check`             | PASS                                                               |
| `npm run typecheck`                | PASS against VS Code 1.80 declarations                             |
| `npm run test:coverage`            | PASS; 56/56 tests                                                  |
| Coverage                           | 95.57% statements, 84.18% branches, 96.20% functions, 97.26% lines |
| `npm run build`                    | PASS; host and webview bundles                                     |
| `npm audit --audit-level=low`      | PASS; zero vulnerabilities                                         |
| Publisher adapter unittest command | PASS; 6/6 tests                                                    |
| `npm run package`                  | PASS                                                               |

The approved RED test files remained unchanged during GREEN.

## Performance

Command: `npm run benchmark`

The benchmark generates exact-size synthetic JSONL in memory and measures core
ingestion plus immutable snapshot projection. Generation time is excluded.

| Envelope                                            | Cold reconstruction | 200-record append | Fit All bounds | RSS delta | Diagnostics |
| --------------------------------------------------- | ------------------: | ----------------: | -------------: | --------: | ----------: |
| 10 MiB, 20,000 records, 500 identities              |            79.48 ms |           1.01 ms |        0.26 ms | 22.22 MiB |           0 |
| 67,108,863 bytes, 100,000 records, 2,000 identities |           859.14 ms |      not measured |        0.26 ms | 25.09 MiB |           0 |

The representative results pass the approved targets of 3 seconds cold,
250 milliseconds for 200 appended records and 100 milliseconds for Fit All.
The maximum supported envelope reconstructed without a diagnostic.

## Package Audit

`tallyhold-agent-monitor-0.1.0.vsix` contains exactly eight files:

```text
[Content_Types].xml
extension.vsixmanifest
extension/package.json
extension/readme.md
extension/docs/verification.md
extension/dist/extension.cjs
extension/media/styles.css
extension/media/webview.js
```

The package contains no `.agent-flow`, environment files, fixtures, tests,
coverage, source, benchmark output, credentials or `node_modules`.

The packager warns that no license file exists. The repository currently
provides no license to include, so this is recorded as an unresolved packaging
warning rather than bypassed or assigned an invented license.

## Editor Compatibility

The final eight-file VSIX installed successfully through each editor's bundled
CLI into separate temporary user-data and extension directories.

| Editor                     | Final VSIX install | Named command and panel       | Full interaction checklist |
| -------------------------- | ------------------ | ----------------------------- | -------------------------- |
| VS Code 1.145.3            | PASS               | UNVERIFIED for the final VSIX | UNVERIFIED                 |
| Trae 3.6.13 / base 1.107.1 | PASS               | PASS                          | PARTIAL PASS               |

An earlier package activated the named command and rendered a panel in VS Code,
but desktop automation selected an unintended local source instead of the
synthetic fixture. That run is not counted as final-candidate compatibility,
and no private stream content was copied into tracked artifacts.

Zack manually opened the final VSIX in Trae, selected the synthetic
`fixtures/smoke.jsonl`, and confirmed the visible source/session, historical
orchestrator and worker nodes, completed worker inspector, separately failed
unmatched tool outcome, last-reported filter, camera controls and keyboard
access. The broader live append, truncation/replacement, read-error recovery,
reactivation, source-switch isolation, three-theme contrast and reduced-motion
matrix remains unverified in Trae. All final-VSIX interaction remains
unverified in VS Code. Unit and DOM tests cover these behaviors, but they do
not replace the remaining editor smoke.

## Release Decision

Automated behavior, coverage, quality, dependency, performance, package-content
and final-VSIX installation checks pass. The named command and core synthetic
inspection workflow pass in Trae. Zack accepted the explicitly reported
remaining compatibility gaps and requested ship on 2026-11-17. Release notes
must not claim verified VS Code compatibility or full editor-lifecycle
compatibility.
