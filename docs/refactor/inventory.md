# Refactor inventory — 2026-09-23

Baseline: HEAD `60653d45fc2a8bb0fe9a4445eac298384c5c7bf4` plus the existing working tree (108 tracked modifications, 406 untracked entries). Snapshot and original diffs: `/private/tmp/obraxen-refactor-xK2nkA/`. No active claims/leases at preflight; runtime valid. This task reserves exact paths under claim `01a0cfad-7d96-7472-a96d-2bf97f3e9406`.

| Pass | Current behavior / consumers | Improvement | Validation / status |
|---|---|---|---|
| 0 | Current checkout is the baseline, including unfinished changes from previous work | Preserve snapshot; establish checks before editing | Baseline lint/build passed; initial tests 759 passed + sandbox-only port failure; later unrestricted run passed. Final validation below. |
| 1 | Consent providers enqueue commands, load scripts, remove cookies | Expanded compressed functions without reordering expressions | Parsed syntax tree identical; browser validation below |
| 2 | `buildRobotsPolicy` remains exported and tested; project facade and dormant public routes have consumers | Completed reference audit; retained compatibility exports; removed duplicated robots output construction | Publication tests pass; no proven unreachable entry point deleted |
| 3 | Menu and privacy panel wrap Tab focus using different selectors | Extracted `focus-navigation.ts`; preserved caller selectors and Escape/restore behavior | Four boundary tests pass; browser validation below |
| 4 | App and Lighthouse share authorization rules but differ on empty image arrays | Extracted `project-publication-authorization.ts` and explicit Lighthouse adapter | Seven evidence cases × three image counts × three asset-map sizes pass |
| 5 | Invalid project metadata returns `{}`; invalid page throws 404 | Extracted `project-route.ts`; left rendering outcomes in callers | Four locales, invalid section/slug/lang, real metadata/JSON-LD and rendered fixture pass |
| 6 | Memory records, context ranking, retention and digests have persistent consumers | Extracted `memory-transitions.mjs`, `memory-context.mjs`, `memory-values.mjs`; facade reduced 797 → 357 lines | 16 moved function bodies and CLI tail unchanged; frozen byte/hash/error/context fixtures and memory suites pass |
| 7 | Schema and storage repeat authorization constants/validators | Shared schema constants, decision and nonempty-text validation; retained facade exports | Authorization/operations + frozen fixture suites: 28 tests pass |

Dead-code decisions must distinguish test-only exports from unused internals. `publicProjects` and approved-image maps are intentionally empty. `project-pages.ts` has application consumers. Legacy lease and authorization checks remain necessary for rejecting incompatible records. No file deletion is planned.

Reference audit: `buildRobotsPolicy` is exercised by `tests/publication.test.ts`; its export is retained with shared output construction. `project-pages.ts` is consumed by both project routes, the section-projects page, project-card and project-case. `readLegacyLease` is used by both lease and preflight; `allowLegacy` remains used by authorization event replay. The single-use private review helper was inlined into the extracted authorization predicate; no compatibility gate was removed.

Separate migrations: framework/dependency upgrades; rendering/cache changes; public API removal; digest or record-format changes; agent storage/architecture changes; changing Lighthouse empty-image acceptance. None are part of these passes.

Review each pass independently against the preserved working-tree snapshot, not only Git HEAD. The final handoff records exact changed paths, checks, and preservation evidence. No remote delivery or dependency audit is authorized by this local refactor.

Final validation: lint and types passed; coverage suite 785/785 passed across 48 files; standard browser suite 122 passed with 17 existing skips; contact harness 2/2 passed; Lighthouse passed all four configured routes. Final default build passed with route classifications identical to baseline. The first broad run caught a Node type-stripping import-resolution regression; explicit `.ts` imports now preserve activation CLI compatibility without changing compiler settings. The passing coverage run includes the real activation CLI tests.

No dependency, framework, API, storage-format or activation migration was performed. `check:security` and the encompassing `check:quality` command were not run: the registry audit requires separate approval. All local components (lint, types, coverage, build, both browser suites and Lighthouse) were run individually. Nothing was pushed or published. Source-change review patch: `/private/tmp/obraxen-refactor-xK2nkA/refactor.patch`; final evidence and preservation check are in the task handoff.
