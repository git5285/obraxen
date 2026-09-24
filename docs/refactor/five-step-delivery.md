# Five-step refactor and generated-output lint isolation

This change preserves the approved Home, legacy application, agent APIs and CLI
contracts. It builds on the Home maintenance candidate in PR #107
(`127082409589482af932ba7b491f4bc51fc7cef1`); that dependency is separate from this
change. No deployment, activation, dependency update or framework migration is
part of this delivery.

## Structural changes

1. Contracts and reconciliation share their identical nonempty-string validator.
   Accepted text retains whitespace and invalid values retain exact error messages.
2. Operations, preflight, control surface, lease and authorizations share the
   strict CLI argument reader. It reads argv at call time, returns the first
   occurrence, returns null when absent and rejects missing/option-shaped values.
   The permissive readers in memory and reconciliation remain unchanged.
3. Project metadata construction is expanded without changing its syntax tree,
   property order, evaluation order, defaults or outputs.
4. Policy validation is split into private helpers. Checks remain in their
   original sequence, preserving the first failure when several fields are invalid.
   Valid policies retain object identity and accepted extension fields.
5. The published Home verifier separates capture, navigation, enquiry and
   disclosures/language checks into private helpers. The original instructions,
   assertions, ordering, reports and resource lifecycle are preserved.

ESLint additionally excludes only `**/.vercel/output/**`, which contains compiled
Vercel bundles and launchers. Source files within `.vercel/candidates/` and alongside
deployment output remain checked. No rule is disabled and no artifact is deleted.

## Parity evidence and regression coverage

The local refactor passed 961 tests and both builds before delivery preparation.
Structural comparison against the preserved working-tree baseline found identical
metadata ASTs, identical expanded validation/verifier statements and identical
extracted helper bodies. All 1298 generated policy variants retained the same
acceptance or exact first error. Six browser snapshots and screenshot hashes
matched before/after, with editorial and no-JavaScript checks also passing.

New tests cover consumer-visible text validation, policy error precedence, CLI
lookup edge cases and malformed input through all five executable entry points.
ESLint tests characterize generated paths and confirm neighboring source paths
remain in scope; the four new generated-output cases fail before the configuration
change. Delivery checks must run on the exact isolated candidate; earlier results
do not substitute for its required quality gate or CI.

The prior shared checkout and its unrelated changes remain preserved. Coordination
markers and post-delivery remote state belong to the control checkout and operational
log, not this candidate.
