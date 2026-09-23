# Protocol parity fixtures

Capture fixtures before agent implementation changes. `tests/fixtures/refactor-protocol.json` records deterministic inputs and baseline outputs; `tests/agents/refactor-protocol.test.ts` replays them using disposable local state only.

Required coverage:

- Fixed timestamps and policy; valid run recording and repeated identical submission.
- Serialized state/record bytes and SHA-256 results, including insertion-order-sensitive memory hashes.
- Candidate discovery, implementation and reconciliation with unchanged identifiers and links.
- Context selection for empty/matching/nonmatching queries, ranking and budget truncation.
- Invalid parent, changed scope, duplicate ID with changed contents, stale reconciliation and invalid evidence digest.
- Authorization valid bundle, unknown/missing keys, wrong sequence/checks and invalid expiry.

Existing agent suites additionally cover locks, retention, migrations, event-chain tampering, leases and authorization execution. Keep their tests intact. Fixtures must be generated from the preserved pre-refactor implementation; expected values are not regenerated from the candidate merely to make tests pass.

Keep the memory JSON hash separate from canonical authorization hashing. Do not normalize stored bytes, reorder keys, change schema versions or retire compatibility behavior. Such changes require their own migration plan and approval.

Captured and replayed successfully against the original and refactored implementations. The frozen fixture includes three runs, duplicate replay, three rejected reports, two rejected reconciliations, a successful reconciliation, twelve query/budget cases (including successful truncation and too-small rejection), a valid authorization and five invalid bundles. Stored-file and returned-result hashes detect field ordering and serialization drift. Baseline snapshot: `/private/tmp/obraxen-refactor-xK2nkA/baseline/`.

The raw reconciliation evidence intentionally exercises the existing memory JSON boundary, including insertion-order-sensitive arbitrary evidence keys. It is synthetic fixture data, never real operational evidence or authority. Existing reconciliation suites exercise the richer typed evidence contract. CLI code and sixteen moved function bodies were also compared structurally to the baseline and are unchanged.

Capture provenance (SHA-256): original `memory.mjs` `e87c83747a86fcc3a4765d7085f81f87846dfaea460d3f6cf9605fa3e865c2c5`; original `authorizations.mjs` `0b6751787a59584c5808bf7ac2bfeb5b8076f9e2695326d878f63f4865831448`; frozen fixture `125abbd00c87b36016dd7d6104224fedcc44f7a6e3f3205b3e1bbd0a6a9bd822`.
