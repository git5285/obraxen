# Evaluate and measure the skill

Use existing repository tools and isolate all fixtures, events and reports from
production state. No evaluation changes policy, hooks, schedules or permissions.

## Deterministic integration

From the repository root run:

```sh
node automation/agents/runtime.mjs exec -- npm run test -- tests/agents/skill-evaluation.test.ts
```

This test runs the evaluator internally, checks its measurements and failure
cleanup, and removes its temporary fixtures. Do not also run the standalone
evaluator by default on the same inputs. A complete successful `npm run test`
or `check:quality` that includes this test supplies the same coverage; a failed
or partial run does not. Required delivery hooks and CI remain mandatory.

Run the standalone evaluator as well when changing its entrypoint, module
loading, console output or exit-code handling; the imported test suite does not
exercise that CLI boundary. It is also available when retained fixture files
and a JSON integration report are needed for diagnosis or evidence:

```sh
node automation/agents/runtime.mjs exec -- node .agents/skills/obraxen-continuous-improvement/scripts/evaluate.mjs
```

Both routes create fresh temporary repositories and state with the existing
module test APIs. They exercise real claim, lease, diff, contract and memory
operations without registering fixtures in production state. Only the standalone
route retains fixture files and state when it returns a JSON report; a global
exception cleans its temporary root before rethrowing. The CLI does not replace
the measurement and cleanup tests. These artifacts are test
evidence, never public evidence or production run reports.

## Model tool canaries

Use independent fresh agents with the same short request, baseline or candidate
skill, and the same fixture content. Give each writer its own temporary root.
Require actual tool calls and artifact checks, not a prediction of what the
agent would do. Preserve tool traces, final responses and before/after hashes.
Cover a capability question, explicitly authorized maintenance and a bounded
cycle or blocked-cycle attempt. The existing `evals/routing-20260906.json`
contains routing cases; `evals/evals.json` contains policy regressions.

For a strict no-write query, observe absence of file writes. For maintenance,
verify a useful requested change, backup, file ownership and retained policy.
For a cycle, use the real control-plane APIs against fresh fixture state and
verify the whole lifecycle, including refusal of protected paths and closure.
Any LLM role or quality check replaced by a fixture must be declared; such a
test is not evidence of a complete autonomous production cycle.

## Measurements

- Keep structural size, deterministic integration results and model canaries
  separate. Smaller entrypoint bytes do not prove fewer total tokens on cycles.
- Measure elapsed milliseconds with a monotonic clock around the actual work.
  Distinguish process time, model wall time and production runtime telemetry.
- Count useful changes only after the requested behavior and exact diff pass
  verification; `no_op` and expected safety blocks are successful outcomes too.
- Classify each observed block as expected or avoidable against the case's
  prerequisites. An unknown cause remains unclassified, not a success.
- Identify repeated checks by check identity and unchanged content digest.
  Repetition after changed input is not redundant. Raw command events remain
  evidence; do not claim a composite command's substeps ran if it failed early.
- Tokens and cost remain `null` unless runtime telemetry supplies them. Do not
  replace missing measurements with zero or estimates.

For comparisons, preserve version digests, prompts, fixture digests and sample
counts. A single paired run supports a local observation, not an estimated
success rate. Keep the production reporting schema unchanged; evaluation
metrics live in a separate report. Reject regressions before promotion.

## Acceptance before promotion

Declare the proposed benefit, cases, repetitions and pass/fail assertions before
running a comparison. When making claims about changed model behavior, test
at least two independent samples per version; add cases for foreign changes, genuine ambiguity,
protected paths and failed checks when those boundaries can be affected.
Use the same fixture inputs and alternate baseline/candidate launch order.
Keep outcome grading separate from time/token measurements and retain failures.
Pure syntax or documentation fixes can use focused deterministic validation;
they do not require a new model comparison unless model behavior is affected.

Reject a candidate with any new safety violation, lost required outcome or
weakened check. Missing evidence means inconclusive, not pass. Require a
demonstrated benefit: for example, rejecting a malformed marker before a real
registration attempt. Prefer a focused deterministic fix when model samples
show no reliable efficiency difference. Do not claim speed or cost improvements
from one favorable run, or turn these sample counts into statistical confidence.

For lifecycle coverage, use separate real scout, writer and read-only reviewer
agents on a disposable repository, retaining outputs and exact diffs. The
controller validates their contracts, handles the claim and lease, and records
the result using isolated state. A scripted fixture quality gate is not the
website Quality gate; inherited production-role hooks must never be disabled
to run an evaluation. Record those limits and any untested production boundary.
Promote only the smallest evaluated change after independent review. Passing
evaluation grants no publication, delivery, scheduling or self-edit authority.
