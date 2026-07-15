# RemainOn autonomous improvement control plane

This directory is a safety harness for recurring Codex runs. It does not make
publication decisions and it does not keep four independent writers alive.

## Architecture

The scheduled task is the **director**. It can delegate to three project agents:

1. `scout` inspects the repository in read-only mode and returns up to
   three structured findings.
2. `builder` is the only writer. It requires an isolated worktree,
   one exact claim, a global lease, an unchanged base SHA and an exact path list.
3. `auditor` independently reviews the resulting diff and can veto it.

This gives four logical roles including the director, but only one possible
writer. A no-op cycle is a successful result.

The director uses GPT-5.5 with high reasoning because the local role-discovery
canary produced a real `spawn_agent` event with that model. The three specialist
roles use GPT-5.6 Sol with high reasoning. Model claims are not trusted: the
canary is judged from tool events and returned child ids, never from prose saying
that delegation succeeded.

Every role response also passes through `contracts.mjs`. A token, prose answer,
malformed JSON or incomplete shape is a blocked run even when the model claims
success.

## Current mode

`policy.json` starts in `shadow`. The scout and director can operate, but
`allowLocalDiff` is false and the builder must not be invoked. Merge,
deployment and publication are permanently human-gated.

The project `.codex/config.toml` replaces the unsafe global default with
workspace-only writes and no shell network. Custom-agent hooks add a second,
deterministic block for Git mutation, dependency installation, external tools
and protected publication surfaces.

## Manual canary

Run from a clean isolated worktree:

```sh
node automation/agents/policy.mjs
node automation/agents/preflight.mjs --json
npm run check:activation -- --json
```

Then invoke `$remainon-continuous-improvement` with a request to run one shadow
cycle. Inspect its structured finding report and verify that it created no diff.

## Shared writer lease

`lease.mjs` stores its lock below Git's common directory, not in a worktree.
Every worktree therefore sees the same writer lease. Acquisition is atomic and
records run id, token, host, PID, worktree, base SHA, exact claim and paths.

An expired heartbeat is only evidence for investigation. The script never
reclaims a stale lease automatically; first inspect the recorded process,
worktree, Git status and claim.

## Promotion gates

Promotion is intentionally incremental:

1. Run at least three reviewed shadow canaries.
2. Add behavior evals for conflicts, prompt injection, unsupported claims,
   protected paths, stale base, failed checks and no-op.
3. Change `mode` to `active` and `allowLocalDiff` to true in a reviewed PR.
4. Permit local diffs only; keep commit, push and draft PR false.
5. After further reviewed canaries, separately consider draft PR creation.

Never enable automatic merge, deployment or publication.

## Scheduling

The recurring automation is deliberately not created by repository files.
Codex Scheduled Tasks need an explicit cadence and local runs require the Mac,
Codex and this project to remain available. Start with a read-only cadence,
review the first runs, and use a hosted orchestrator later only if true 24/7
operation is required.

The initial prompt should explicitly invoke
`$remainon-continuous-improvement`, request one shadow cycle, forbid changes and
require the structured final report. Do not schedule the builder directly.

## Why no Agents SDK service yet

Codex 0.144.2 already supplies custom roles, subagents, worktrees, hooks, skills
and recurring tasks. An Agents SDK service would add an API key, queue, database,
sandbox lifecycle and operational cost before the native shadow loop is proven.
It remains the phase-two option for a hosted 24/7 controller with durable
approvals, traces, evals and sandbox snapshots.
