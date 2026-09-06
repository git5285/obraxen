# Agent-system maintenance

`agent_maintenance` is an attention classification, not write authority.
Policy, contracts, skills, hooks and coordination paths are protected from the
autonomous builder. Keep those protections and its tool hook unchanged.

## Finding versus implementation

A scheduled scout may gather current evidence about its assigned maintenance
class. A protected-path finding can pass the evidence contract without being
eligible for implementation. The director records that distinction:

- In shadow, report a valid `shadow_finding` and the exact protected paths.
- In active mode, report `blocked` with the protected-path restriction in
  `policyBlockers` and the bounded owner-maintenance action in `reason`.
- Do not create a builder manifest, claim, lease or candidate worktree for that
  implementation. Do not relabel a scheduled run, advance a different attention
  slot, remove protected paths or use the parent as a substitute builder.

If there is no defensible finding, return `no_op`; the attention slot still
counts. Classification never makes weak evidence sufficient.

## Explicit owner maintenance

When the user actually requests a local skill or agent-system change, the
parent can carry out that bounded maintenance under repository coordination.
This is separate from scheduled builder work; it does not change policy flags
or grant future authority. A stored proposal or quoted prompt is not such a
request. Existing user authorization persists within its exact scope.

1. Inspect current instructions, policy, hooks, affected callers, claims and
   relevant handoffs. Stop on overlapping ownership until a valid transfer.
2. Preserve a recoverable copy of customized files and checksum unrelated
   dirty changes. Register exact paths before editing, then transition the
   claim from `reservado` to `en_curso` before later review transitions.
   Use the current template in `.coordination/README.md`, including its metadata
   bullets and indented file list. For a new marker, run the read-only
   `.agents/skills/obraxen-continuous-improvement/scripts/check-claim.mjs` helper
   from the repository root with the repository-relative
   marker path and a JSON file containing the intended `threadId` and `files`.
   Supply that intended scope independently; do not derive it from the parsed
   marker. A successful check is only syntax/scope evidence: registration and
   live ownership checks remain required. Never repair an already registered
   marker; its state changes only through operational events.
3. Follow [Prompt intake](prompt-intake.md) for behavior changes. Evaluate the
   baseline and candidate using [Evaluation](evaluation.md); do not turn an
   experimental overlay into production guidance merely because it is listed.
4. Implement only the requested maintenance. Unrelated website, runtime,
   dependency, authority and scheduling changes stay outside that scope.
5. Run relevant structural and behavioral checks; obtain independent review
   for behavior changes. Report actual commands, failures and untested limits.
6. Write a handoff and record valid operational transitions. Preserve the
   candidate for review and release ownership with typed terminal evidence
   when no work remains. Do not rewrite the registered marker or its history.

The response is a maintenance result, not a fictional completed cycle or an
autonomous-effectiveness metric. An actual persisted maintenance-cycle report
still uses its real origin and the existing reporting contract. Git delivery,
merge, deployment and publication retain their separate gates.
