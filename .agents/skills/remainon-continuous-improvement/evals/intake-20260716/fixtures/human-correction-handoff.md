# Synthetic handoff fixture

- fixture_only: true; this is not a RemainOn project fact.
- correction_origin: explicit user decision.
- rejected_approach: lower the 320 px reflow assertion so Linux CI becomes green.
- accepted_approach: preserve the assertion and harden the layout against the runner artifact.
- reason: a failing evidence-based quality gate is evidence to correct the implementation, not permission to weaken the gate.
- scope: testing and layout regressions across future runs.
