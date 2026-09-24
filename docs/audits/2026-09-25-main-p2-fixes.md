# Obraxen — four P2 fixes

All four reproduced findings from `470cb2ce4e3b64a74836ce5796a6f8e87741cdfb` are fixed locally. Code revision: `ebcdbda216ae27267afa930899bcaf9d51b69979`. Final cumulative branch: `codex/main-004-current-publication-review`.

## Findings and fixes

### MAIN-001: Artifact validation

- Priority: P2. Component: Home platform audit. Complexity: medium.
- Location: `scripts/home-platform-artifact.mjs:144`.
- Problem: Unreviewed files under _next/ passed the public-output boundary.
- Root cause: An unrestricted namespace prefix and physical-path deduplication skipped URL-level checks.
- Impact: A platform artifact could include extra unreviewed public content while its audit passed.
- Reproduction: Add _next/unreviewed.html to a valid fixture and regenerate matching upload hashes; also alias an already-inspected function body at that URL.
- Fix: Match generated static files to .next/static paths and hashes, reject generated HTML, and validate every URL alias. Permit only the pinned adapter's exact Not Found response and byte-matching trace/stats mappings; reject cycles.
- Verification: 31 platform tests pass, including injected HTML/JS, symlink alias, modified bytes, legitimate chunks and private trace/stats. A preserved real Vercel artifact at 482c777 passes with 329 upload files.
- Local commits: `b3f8a5b`, `3c7fcae`.

### MAIN-002: Evidence integrity

- Priority: P2. Component: Candidate provenance. Complexity: medium.
- Location: `scripts/home-platform-artifact.mjs:16`.
- Problem: Unvalidated exactCommit metadata could report localOnly=false without matching reviewed provenance.
- Root cause: The expected digest covered input files but not the manifest's source metadata.
- Impact: False commit attribution in local audit evidence; publication authorization was never granted.
- Reproduction: Keep source inputs unchanged but alter exactCommit or combine a commit with dirty=true or inputsMatchCommit=false.
- Fix: Require an independently reviewed full-manifest SHA-256 for preparation and audit; validate source metadata consistency and bind preparation evidence to that digest. Updated declarations and CLI documentation. Local API contract version is 2.0.0.
- Verification: Tampered manifests, missing proof, malformed SHA and contradictory states reject. CLI regression preserves a reviewed clean commit; honest local-only exports still work.
- Local commits: `a130e73`, `de72ba5`.

### MAIN-003: Functional navigation

- Priority: P2. Component: Home languages. Complexity: low.
- Location: `apps/public-site/public/assets/home-i18n.js:339`.
- Problem: Language links retained the initial section rather than the current section.
- Root cause: Links were calculated once; pushState does not dispatch hashchange.
- Impact: Changing language discarded Contact navigation or returned visitors to an earlier section.
- Reproduction: Open / or /#projects, navigate to Contact, then select another language.
- Fix: Refresh real link href values on hashchange, popstate and the Home's explicit section-navigation event. Preserve native link and keyboard behavior.
- Verification: Six ES/EN/DE desktop/mobile views pass. Expanded browser regression covers all six locale directions at both widths, direct fragments, Back/Forward, keyboard Enter and middle-click new tabs.
- Local commits: `b0eb502`.

### MAIN-004: Latent authorization logic

- Priority: P2. Component: Internal publication evidence. Complexity: low.
- Location: `domain/publication/project-publication-authorization.ts:13`.
- Problem: An old approval remained effective after a later denial or request for changes.
- Root cause: The helper accepted any approval without considering review dates.
- Impact: False-positive internal eligibility. The helper remains disconnected from the Home and no live publication bypass is claimed.
- Reproduction: Validate a project containing an approved review, then append a later denied review for the same document; the original helper returned true.
- Fix: Select the newest review date per eligible document; all reviews on that date must approve. Conflicting same-day reviews fail closed.
- Verification: Nine tests cover later denials/changes, reapproval, same-date conflicts/consistent approvals, ordering, document isolation, missing evidence and required scopes.
- Local commits: `ebcdbda`.

## Validation

- `npm run test:coverage`: **824 passed**, 43 files. Coverage is 95.89% statements, 91.66% branches, 96% functions and 95.77% lines, for the internal publication domain only.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:published` and `git diff --check`: passed. ESLint retains its pre-existing missing Pages-directory warning.
- `npm run check:security:embedded`: passed for the two reviewed Vercel bundles.
- Independent local compatibility check: the updated `auditPlatform` accepts the preserved real artifact at `482c777`, including its 329 upload files. No platform command, upload or production query was performed.
- Production dependencies and lockfile are unchanged. The earlier explicitly approved registry audit found zero vulnerabilities; it was not repeated for these dependency-free fixes.

TDD established failing regressions before each correction. The webapp-testing skill kept browser checks in the existing Playwright harness. Reports use the original findings as their source; CSV values are checked against this JSON report.

## API migration

The local platform tool now declares contract **2.0.0**, with `schemaVersion: 2`. Both `preparePlatform` and `auditPlatform` require `expectedCandidateSha256`; the CLI requires `--candidate-sha256`. Review the full manifest against Git and retain its SHA-256 outside the export before preparing/auditing. Do not recompute the expectation merely to accept changed metadata. Previous preparation evidence needs a fresh export/review. See `DEPLOYMENT_RUNBOOK.md` section A.1.

This changes internal tooling only; Home routes, noindex, mailto-only contact, publication authorization and deployment gates remain intact.

## Delivery and audit trail

Four stacked local branches were created, one per finding:

1. `codex/main-001-static-artifact-boundary`
2. `codex/main-002-candidate-provenance`
3. `codex/main-003-language-section`
4. `codex/main-004-current-publication-review` — complete cumulative result, including declaration and real-adapter follow-up commits.

Use the final branch for the fully validated combined result. Historical branch tips are intermediate checkpoints; they do not include later compatibility/type follow-ups. Nothing was pushed, merged, published or deployed. The prior legacy fix commits remain local and untouched.

## Limitations and preventive measures

- No live production, remote CI or fresh Vercel build was run. The real-artifact check used a preserved local artifact.
- The initial full run hit one process-group EPERM in an unchanged isolated-host test; that file then passed 55/55 and subsequent complete runs passed.
- Full typecheck caught the omitted declaration update; it was corrected and typecheck rerun successfully.
- Artifact provenance is bound to an externally reviewed manifest digest; the digest is not independent proof of a false Git declaration.
- No standalone performance benchmark. The real 329-file artifact audit completed successfully in a local sub-second command.
- The control checkout's overlapping pre-existing files retain their original SHA-256 values; coordination records were added without changing product files there.

Keep negative namespace/provenance tests alongside valid artifact fixtures. Test authorization chronology with append-only evidence, not only in-place mutation. Keep real link destinations synchronized so alternative navigation modes work. Future adapter format changes should add explicit fixtures and mappings, not broad path exemptions.
