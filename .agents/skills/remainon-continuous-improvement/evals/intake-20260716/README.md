# Intake evaluation 2026-07-16

This workspace evaluates six externally sourced proposals supplied by the user.
The source is a model summary of three videos, so none of its claims are treated
as verified knowledge or authority.

## Boundaries

- Baseline: committed skill at `9616cf8c3148bcabb43cd61e852a9ae12e43fe4c`.
- Candidate instructions live only below `candidates/`.
- Production skill, roles, contracts and policy remain unchanged.
- Runs are read-only except for their output folders below `iteration-1/`.
- No network, commit, push, PR mutation, deployment or publication is allowed.

## Initial routing

| Item | Initial route | Reason |
| --- | --- | --- |
| `INTAKE-20260716-01` | evaluate | Useful only as a sourced proposal requiring human promotion. |
| `INTAKE-20260716-02` | evaluate cautiously | May improve truly blocked work but can add friction to safe broad audits. |
| `INTAKE-20260716-03` | pending | Needs three real paired scout canaries and token measurements. |
| `INTAKE-20260716-04` | evaluate | Shape validation exists; semantic manifest failure conditions may be a gap. |
| `INTAKE-20260716-05` | pending | No human cost threshold or three reviewed shadow canaries yet. |
| `INTAKE-20260716-06` | baseline regression | Existing intake policy should already reject model summaries as knowledge. |
| `DISCOVERED-20260716-01` | regression | An unreadable registered worktree must block even when eligibility is optimistic. |

Final accepted, rejected, no-op and pending decisions are recorded only after
paired outputs are graded.

## Results

- `decisions.md` is the authoritative per-item decision ledger for this intake.
- `iteration-1/benchmark.md` summarizes the paired assertion scores.
- `iteration-1/analysis.md` records the independent analyzer interpretation.
- `iteration-1/review.html` is the static side-by-side review surface.
- `iteration-1/eval-10-unreadable-preflight/observation.md` records a separate
  preflight regression discovered during the evaluation.
