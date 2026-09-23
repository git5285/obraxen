---
name: obraxen-continuous-improvement
description: Run explicitly requested/scheduled Obraxen improvement cycles or agent-system maintenance. Exclude ordinary website questions, audits and individual edits.
compatibility: Codex 0.144.2 or newer, Git worktrees, the exact Node.js and npm versions pinned by the repository, and this repository's coordination protocol.
---

# Obraxen continuous improvement

Choose the requested outcome before loading a procedure. This skill coordinates
work; use the existing domain tools for design, SEO or testing only as needed.

| Request | Read next | Outcome |
| --- | --- | --- |
| Capability question or prompt draft | Only sources needed to answer | Requested answer; no cycle, claim or run record |
| Explicit local skill or agent-system maintenance | [Maintenance](references/maintenance.md) | Scoped, backed-up, evaluated change; no autonomous authority expansion |
| Ordinary website audit or individual edit | Applicable domain workflow and repository coordination | Requested report or scoped change; no autonomous cycle |
| Explicitly requested agent cycle | [Cycle](references/cycle.md) | One complete bounded cycle; valid no-op is success |
| Scheduled wake-up | [Cycle](references/cycle.md), then [Reporting](references/reporting.md) | Exact scheduled class, policy gates and durable report |
| Evaluate a proposed skill change | [Evaluation](references/evaluation.md) and [Prompt intake](references/prompt-intake.md) | Baseline/candidate evidence with explicit test limitations |

Do not load all references for every task. A cycle must load the complete cycle
procedure before acting and the reporting contract before recording its result.
Referenced repository paths and commands are relative to the repository root.
Skill-relative references resolve from this skill directory.

## Essential boundaries

- Follow repository instructions, exact file ownership and immutable operational
  events. Preserve other tasks' changes. Registration precedes editing.
- A scheduled director never substitutes itself for a blocked builder. A
  maintenance attention slot classifies findings; it does not authorize writing
  protected paths. See [Maintenance](references/maintenance.md).
- Require the exact repository runtime for project commands:
  `node automation/agents/runtime.mjs exec -- <command>`. A cycle requires a
  verified runtime fingerprint and matching role outputs.
- Keep one bounded writer, an isolated worktree and a valid lease for a cycle.
  No automatic stale-lease reclamation, relaxed tests or widened path scope.
- Keep evidence types distinct. Never invent identity, legal facts, commercial
  evidence, professional approvals, publication permission or telemetry.
- Existing tools come first. Presence of an experimental overlay under
  `evals/` is not production approval; read its recorded decision.
- Keep publication, deployment, merge and delivery gates. This skill grants
  none of those actions and does not create schedules by being installed.

## Read-only requests

Distinguish no website edits from no file writes anywhere. Preflight refreshes
the private clone registry; report recording also writes private state. If the
user prohibits those writes, use available read-only evidence, omit those
commands and report unverified prerequisites. Do not invent runtime eligibility
or claim a fully verified, persisted cycle. Normal scheduled cycles retain
their recording requirements.

## Validation and reporting

Use checks appropriate to the authorized scope. Website cycles retain their
full gate. Inspect package scripts and their runner: `check:quality` covers lint,
types, the unit suite with coverage and build without also running plain `test`.
A successful complete invocation covers the equivalent `check` requirements.
A partial or failed invocation does not supply passed coverage.

Report human maintenance in the user's requested format. Actual cycle reports
must use [Reporting](references/reporting.md). Evaluate this skill with
[Evaluation](references/evaluation.md); distinguish tool canaries, deterministic
integration tests and production cycles in every result.
