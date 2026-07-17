# Obraxen autonomous improvement control plane

This directory is a safety harness for recurring Codex runs. It does not make
publication decisions and it does not keep four independent writers alive.

## Architecture

The scheduled task is the **director**. It can delegate to three project agents:

1. `scout` inspects the repository in read-only mode and returns up to
   three structured findings.
2. `builder` is the only writer. It requires an isolated worktree,
   one exact claim, a machine-user-shared lease, an unchanged base SHA and an
   exact path list.
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

## Durable memory and context

`memory.mjs` gives each cycle bounded long-term memory without turning old model
output into authority. It stores immutable run reports and a compact derived
index below Git's common directory, so every worktree sees the same history
while generated state stays outside commits. This memory remains local to one
clone; unlike the writer lease and clone registry, it is not shared across
independent clones.

Each cycle receives only the most recent runs and the most relevant open
findings. Every recalled finding carries its last observed SHA and is marked for
revalidation when the repository has moved. Duplicate findings are grouped by
domain and candidate paths. Token, cost and duration totals include only values
reported by the runtime; the system never invents telemetry.

Learned rules are retained only as quarantined proposals. They are not placed in
the agent context and cannot edit prompts, policy or code. Promotion remains a
separate human-reviewed repository change.

Useful commands:

```sh
node automation/agents/memory.mjs status
node automation/agents/memory.mjs context --base-sha "$(git rev-parse HEAD)"
node automation/agents/memory.mjs record --file report.json
```

## Current mode

`policy.json` is currently `active` only for isolated local diffs after three
reviewed shadow canaries converged safely. `allowLocalDiff` is true, while
commit, push, draft PR, merge, deployment and publication remain false. The
pre-tool hook still denies the builder unless both active mode and local-diff
authority are present, and it cannot use Git, network or protected paths.

The project `.codex/config.toml` replaces the unsafe global default with
workspace-only writes and no shell network. Custom-agent hooks add a second,
deterministic block for Git mutation, dependency installation, external tools
and every path in `protectedPaths`. In active mode, the builder may write only
through `apply_patch`, only to canonical paths explicitly present in its manifest.

Policy limits have explicit enforcement owners:

| Limit | Enforcement |
|---|---|
| concurrent writers | machine-shared atomic lease keyed by normalized `origin` |
| pending local diffs | every non-released claim blocks a second writer; awaiting-review claims also enforce the pending limit |
| findings | response contract validator |
| changed files and diff lines | deterministic diff policy |
| run time | Codex `job_max_runtime_seconds` plus the director deadline |
| correction iterations | director state machine; the auditor never repairs |
| lease TTL | investigation signal only; stale leases are never auto-reclaimed |
| active system PRs | reconciled with live PR state before any PR action |

The last three are orchestration gates rather than claims of enforcement by the
filesystem hook. With PR authority disabled in shadow, their safe result is a
block or no-op.

## Manual canary

Run from a clean isolated worktree:

```sh
node automation/agents/policy.mjs
node automation/agents/preflight.mjs --json
npm run check:diff
npm run check:activation -- --json
```

Then invoke `$obraxen-continuous-improvement` with a request to run one shadow
cycle. Inspect its structured finding report and verify that it created no diff.

`preflight.mjs` is read-only with respect to the repository, but it updates the
current clone's heartbeat in the private coordination registry outside the
checkout. Production CLI calls use one fixed state root below
`~/.local/state/obraxen`; tests inject an isolated absolute root through the
module API.

## Shared writer lease

`lease.mjs` stores its lock in private user state, keyed by a normalized
credential-free `origin` identity. HTTPS and SCP-style SSH clones of the same
remote therefore share one atomic lease even when they have independent Git
directories. The record includes run id, token, host, PID, worktree, base SHA,
exact claim and paths.

This is not a distributed lock: different OS users or machines do not share the
state root. A hosted writer would require a separate external coordination
mechanism; the current hosted route therefore remains shadow-only.

The same state root contains a registry keyed by each clone's Git common
directory. Every preflight registers its current clone, validates every known
clone's root, common directory and origin, and merges all of their worktree and
claim scans. A corrupt entry, changed origin, missing clone or unreadable
worktree fails closed. An immutable machine-local binding also prevents a clone
from escaping its existing state merely by changing `origin`. Registry entries,
clone bindings and stale leases are never removed or reclaimed automatically;
inspect the associated process, worktree, Git status, claim and handoff before
a human removes any of that state.

Protocol version 2 is an explicit cutover gate. Acquisition is denied while any
registered clone still uses the legacy Git-common-dir lease or retains a legacy
owner record. Before enabling a writer after promotion, stop every old scheduler
or manual runner, inventory clones that may not have registered yet, and update
or explicitly retire every legacy clone. New code cannot prevent an unknown or
already-running legacy binary from ignoring the new state, so mixed-version
writers are never an allowed deployment mode.

Heartbeat and release operations use a token-scoped atomic operation lock. This
prevents a delayed operation from overwriting or deleting a newer acquisition.
Lease tokens are reserved permanently by hash and cannot be reused. An
abandoned operation lock or token reservation is an investigation signal and
is not reclaimed automatically.

Inspect the shared location, clone records and current owner without changing
them:

```sh
node automation/agents/lease.mjs status
```

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

The current authorization stops at step 4. A local diff must pass the complete
gate and independent audit, then remain available for human review; it cannot
commit or leave the machine.

## Scheduling

Scheduling is external Codex application state and must be verified there; the
repository does not prove that a task exists or is enabled. When configured,
the intended task runs one bounded cycle every six hours and may produce one
isolated local diff, but cannot commit, push or create a PR. Local runs require
the Mac, Codex and the registered clone to remain available, so they provide
continuity but not a 24/7 availability guarantee. The repository also contains
a compiled GitHub Agentic Workflow source as the hosted route; it remains
manual-only and shadow-only until its inference credential, budget and canary
gate are approved.

The prompt invokes `$obraxen-continuous-improvement` and requests one complete
policy-controlled cycle. It never schedules the builder directly; the director
may invoke it only after preflight, selection, claim, lease and manifest gates.

## Hosted evolution path

The recommended progression is local shadow, hosted shadow, active local diffs,
then draft pull requests. Automatic merge, deployment and publication never
enter the autonomous authority set. `AUTONOMOUS_IMPROVEMENT.md` records the
architecture, availability limits and promotion gates.

GitHub Actions is the first hosted runner because the repository, claims, pull
requests and quality gate already live there. A separate Agents SDK controller
is justified later only if durable pause/resume approvals, centralized traces,
cross-repository queues or sandbox snapshots become necessary.
