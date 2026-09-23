# Behavior contracts

## Current six-pass clarification — 2026-09-23

The localized layout currently declares `force-dynamic`; analytics-config declares
`force-static`. The layout reads availability at request time, whereas the endpoint
retains the build-time IDs. They do not share one configuration snapshot. Changing
that timing is a separate functional decision, not part of this refactor.

Shared locales remain `en, de, es, fr` in that order. Service media is keyed by a
stable dictionary service ID; existing order, copy and homepage service output are
preserved. A reordered translation must keep each service's image and icon.

Public-route dependency checks follow local imports, re-exports and literal dynamic
imports transitively, and reject private project data. The public registry remains
empty. Contact extraction preserves validation order, rate-limit state, byte limit,
provider payload, idempotency and HTTP responses. Browser test relocation preserves
the full title/project inventory and existing skip conditions.

The results below describe the earlier refactor run, not a fresh certification of
the current tree. Current six-pass evidence is recorded in `six-passes.md`.

| Surface | Invariant | Evidence |
|---|---|---|
| Public API | Existing exports, component props, CLI commands and routes remain callable | Typecheck, build, existing callers and tests |
| Project routes | Four localized section names; unsupported language/section/slug rejected; metadata `{}` versus page 404 stays distinct; static params unchanged | Route-resolution fixtures and route/SEO/project tests |
| Publication | Matching approved legal review must reference a document covering both scopes; public app requires nonempty approved images; Lighthouse keeps its historical empty-array acceptance | Publication parity matrix; activation/publication suites |
| Preview | Empty public project inventory, closed robots/sitemap, approval boundaries unchanged | Existing routes, public artifacts, activation tests |
| Focus | Forward last-to-first and reverse first-to-last; no intervention inside list; empty list safe; each caller retains selector, Escape and restore target | Focus helper tests and menu/privacy browser tests |
| Consent | No provider request before opt-in; same queued commands, defaults, IDs, callbacks, cookies and revocation order | Identical parsed syntax tree and passing consent browser tests |
| Contact/config | Status/body/headers and availability remain unchanged; analytics static snapshot and contact runtime semantics unchanged | Existing contact, analytics, E2E tests |
| Memory | Same field insertion order, filenames, hashes, candidate linkage, retained records, query ranking and errors | Frozen pre-refactor fixtures and memory/reconciliation suites |
| Authorization | Same schema keys, checks, order, expiry, legacy rejection, error text and digest bytes | Authorization/operations suites and protocol fixtures |

Validation uses Node 24.18.0 and npm 11.16.0 via `automation/agents/runtime.mjs`. Baseline failures are recorded separately from regressions. After affected checks pass, run lint, types, coverage, build and existing browser suites. The network dependency audit requires separate repository approval; do not silently bypass or report the full `check:quality` gate as passed without it.

Coverage exclusions are not parity evidence: directly exercise extracted behavior where needed. Prefer narrow observable outputs over whole-tree UI snapshots. Build route count, dependency versions, rendering mode, public data and activation settings are not refactor targets.

Completed evidence: 785 tests passed; existing standard E2E 122 passed/17 declared skips; contact harness 2 passed; Lighthouse passed four routes; final build route classifications match baseline. The route fixture now verifies nonempty localized metadata, JSON-LD and actual rendered markup; protocol fixtures compare frozen byte hashes instead of accepting freshly generated candidate expectations. React/Next review retained client/server boundaries, awaited route params and caller-specific `notFound()` behavior.
