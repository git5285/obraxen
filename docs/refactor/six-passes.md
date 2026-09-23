# Six maintenance passes — 2026-09-23

Scope: local behavior-preserving implementation of the six findings. Baseline is
the current working tree, not HEAD or production. Before changes: 912 source and
coordination files hashed, 108 tracked modifications, 422 untracked status entries;
no active claims or leases, runtime/preflight valid. No file deletion, remote
operation, dependency upgrade, publication or activation change is included.

| Pass | Preserved behavior | Structural improvement | Validation |
|---|---|---|---|
| Analytics | Dynamic layout availability, static endpoint IDs, consent requirement | Correct obsolete shared-snapshot explanation; characterize response and layout | Rendering-policy and response tests; real build/runtime probe; existing consent E2E |
| Locales | Four locales in original order, same routes and rejection policies | Dependency-free shared list; retain i18n exports | Routes, schemas, contact, publication and activation CLI tests |
| Services | Same order, copy, images, icons and homepage service shape | Stable service IDs and typed media map instead of positional parallel arrays | Four-language fixed asset expectations and reversed-copy regression |
| Public boundary | Empty public inventory; internal evidence stays private | Traverse local dependencies, including re-exports and dynamic imports | Real application graph plus injected transitive-leak fixtures; observable empty registry |
| Contact | Same body limit, validation order, rate-limit state, timeout, idempotency and responses | Extract bounded stream reader, then provider adapter in separate validated steps | Existing 12 route cases passed after each extraction; helper boundary and provider tests |
| Browser suites | Same test titles, browsers, skips and assertions | Move consent and menu cases into dedicated specs; update testMatch | Exact 139-case title/project inventory match; standard and contact browser runs |

Baseline targeted suites: 156 tests passed in 7 files. No claim of a full baseline
quality gate. Initial new service test incorrectly assumed Next image objects in
Vitest; corrected to compare imported assets. Sandbox loopback restriction in
qa-port was rerun with local networking permitted, without weakening the test.

## Separate decisions

- Unifying analytics build-time and runtime configuration changes behavior.
- A shared/distributed contact rate limiter changes infrastructure and semantics.
- Framework, dependency, persistent protocol or authorization changes are out of scope.
- The public dependency scanner follows static local module references. Nonliteral
  dynamic references fail closed; it is not a general information-flow proof.
- Security registry audit and the full check:quality require separate approval.

## Verification status

- Targeted baseline: 156/156 tests passed across 7 files before implementation.
- Final coverage run: 802/802 tests passed across 51 files. Coverage applies only
  to the repository's configured subset, not the whole repository.
- Lint and TypeScript passed.
- Standard Playwright: 122 passed, 17 intentional skips. Before/after discovery
  yielded the exact same 139 title/project pairs. Moved test bodies and skip
  conditions were compared byte-for-byte with the original blocks.
- Contact-enabled Playwright: 2 passed, using intercepted API responses.
- Real analytics timing probe: the build contained synthetic IDs `G-TEST123456`
  and `testclarity1`. Starting it once with no runtime IDs and once with a different
  runtime GA ID returned the original endpoint JSON in both cases; the rendered
  layout reported availability false and true respectively. Both task-owned
  servers exited successfully. No provider requests were made by this probe.
- Activation CLI ran successfully as a check and intentionally returned exit 1:
  `NO-GO`, publishSwitch false, publicationAuthorized false, six existing blockers.
- Final default-environment build passed: localized pages remain dynamic,
  analytics-config remains static, contact/config remain dynamic. The generated
  next-env.d.ts was restored exactly to its pre-task content.
- Preservation audit: all original files outside the reserved source/documentation
  paths retain their baseline SHA-256. No original file was deleted.
- No security registry audit or encompassing `check:quality` was run; neither is
  claimed green. They are not required for this local-only handoff and need
  separate approval before remote delivery under repository policy.

## Integration onto current main — 2026-09-23

The delivery candidate preserves main’s Spanish legacy default and the architecture
Home assertions from PR98. The five consent/menu cases are extracted from current
main byte-for-byte, not restored from the older local snapshot. The new sticky
navigation case is retained. The public/legacy launchers and separate Playwright
report directories from PR104 are preserved. Earlier verification counts above
remain historical; the delivery receives a new full gate and remote CI before merge.
