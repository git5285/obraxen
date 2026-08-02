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

Preflight verifies the repository runtime, not provider- or account-level model
availability. After a specialist model changes, or after a launch reports that
its model is unsupported, the director must run one bounded read-only specialist
canary with `fork_context=false`. Recovery requires both a real child id from the
`spawn_agent` tool event and output that passes the role contract. A launch error
is non-evidence and never authorizes a retry that would duplicate a scheduled
cycle.

Every role response also passes through `contracts.mjs`. A token, prose answer,
malformed JSON or incomplete shape is a blocked run even when the model claims
success.

## Common runtime

`runtime.mjs` is the only launcher for Node, npm and project commands used by
the director, scout, builder and auditor. It finds the exact Node version pinned
in `.nvmrc`, then verifies the exact npm version, lockfile checksum, installed
dependency tree and the `rolldown` native binding before executing anything.
The resulting SHA-256 fingerprint includes those measured values plus platform
and architecture. Preflight blocks both scouting and writing on any mismatch;
every specialist response, run manifest and durable report must carry the same
fingerprint.

The launcher deliberately rejects a merely compatible major version. It also
rejects the embedded ChatGPT Node runtime when macOS library validation prevents
it from loading the project's native binding. Local runs use the separately
installed pinned runtime; GitHub obtains the same exact version from `.nvmrc`.

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
domain and candidate paths. A selected improvement also receives one stable
`candidateId`: discovery, implementation, review, delivery and closure are
stored as an ordered parent/child chain below that candidate. Advancing a phase
therefore does not increase the finding occurrence count. Legacy schema-v1
through schema-v5 state is read compatibly without inventing candidate identity,
historical reconciliation, execution origin, runtime fingerprints or attention
classes. Existing values remain visible, unknown fields stay `null`, and the
state is written as schema v6 on the next legitimate record.

Every new schema-v6 report declares one execution origin, one attention class
and one verified runtime fingerprint. Origins are:
`scheduled_autonomous`, `human_directed`, `control_plane_maintenance` or
`delivery`. This is independent from the phase trigger, although invalid
combinations fail the contract. The context exposes all activity under
`metrics.operational` and `metrics.activityByOrigin`; only runs and candidates
originating as `scheduled_autonomous` contribute to
`metrics.autonomousEffectiveness`. Human requests, control-plane improvements
and delivery work therefore cannot inflate the claimed efficacy of the
scheduled system.

## Deterministic attention budget

`attention.mjs` prevents the control plane from becoming its own main product.
The policy defines one repeating ten-cycle sequence with seven `product` slots,
two `reliability` slots and one `agent_maintenance` slot. Product includes
evidence, UX, accessibility, SEO, localization and performance. Reliability
includes security, testing, reliability and maintainability outside agent
surfaces. Any candidate path matching the configured agent patterns takes
precedence and is classified as agent maintenance.

The memory context exposes the exact next scheduled class, cursor, completed
windows, target percentages and measured totals. A scheduled report must match
that next class before it can be written. A valid `no_op` advances the cursor as
well, so the system cannot repeat one slot until it finds convenient work.
Human-directed, control-plane and delivery reports are counted operationally but
do not alter the autonomous cursor. Every scheduled wake-up remains
`trigger=scheduled_cycle`; relabelling it as a follow-up cannot bypass the
budget.

`finalCommit`, `pullRequest` and `reviewDecision` are declared lineage data, not
proof of current Git or GitHub state. The separate reconciliation gate must
verify them before any external action. Token, cost and duration totals include
only values reported by the runtime; the system never invents telemetry.

## Deterministic reconciliation

`reconcile.mjs` closes the gap between declared lineage and observed delivery
state without asking a model to interpret it. It reads local Git itself and
accepts the exact JSON shapes returned by read-only `gh pr view` and
`gh pr checks`. It never invokes `gh`, fetches, pushes or changes a pull request;
`allowNetwork` remains false. An authorized controller must collect the remote
evidence and pass it through files outside the repository.

The outcome can remain local/pending, become ready for human merge, or close as
`merged`, `rejected` or `superseded`. A closed unmerged PR without an explicit
declared decision becomes `needs_human`. A previous merge becomes `regressed`
only when the candidate's exact declared verification fails on the current
default-branch SHA. Similar wording, changed paths or a red unrelated check are
not enough.

Inspect before writing memory:

```sh
gh pr view <url> --json baseRefName,closedAt,headRefOid,isDraft,mergeCommit,mergedAt,number,reviewDecision,state,url > /tmp/obraxen-pr-view.json
gh pr checks <url> --json bucket,link,name,state,workflow > /tmp/obraxen-pr-checks.json
node automation/agents/runtime.mjs exec -- node automation/agents/reconcile.mjs inspect \
  --candidate-id <candidate-id> \
  --id <reconciliation-id> \
  --observed-at <iso-timestamp> \
  --pr-view /tmp/obraxen-pr-view.json \
  --pr-checks /tmp/obraxen-pr-checks.json
```

After reviewing that deterministic output, replace `inspect` with `apply` to
persist one immutable reconciliation record. `list` shows candidates and their
latest derived outcome. Repeating the same reconciliation id with identical
content is idempotent; conflicting reuse or evidence collected before the
candidate's latest run fails closed.

## Append-only operational closure

`operations.mjs` keeps claim transitions in the machine-shared coordination
root rather than rewriting versioned metadata after delivery. A claim starts as
one exact Markdown marker and is registered once. The marker then stays
immutable; `en_curso`, `bloqueado`, `esperando_revision`, `liberado` and an
explicit human reopening are append-only events chained by previous event id.

Every event binds to the marker's SHA-256 digest and exact reserved paths. A
release requires a typed reference to terminal reconciliation, a merged PR, an
immutable no-op report, a handoff checksum or a human decision. A closed
unmerged PR or blocked report needs an additional reconciliation, handoff or
human decision. Model prose and an isolated commit are not closure evidence.
Reopening a released claim always requires a human decision reference.

`preflight.mjs` overlays the latest valid event on every matching marker. A
corrupt or forked stream, missing predecessor, marker drift or unreadable shared
state fails closed. An active event whose worktree marker disappeared remains
an active claim. A released event may outlive a deleted worktree as historical
evidence without creating another repository diff.

During migration the initial marker remains in the checkout. Older runners that
do not understand operational events therefore continue to see an active claim
and block conservatively; they cannot incorrectly treat the work as released.
After a candidate PR merges, the controller appends one evidenced release event
instead of changing claim/handoff Markdown and opening a metadata-only PR.
The marker belongs in the director's control worktree, never in the candidate
branch. After a verified release it may be retired locally; the shared event
chain remains the durable history.

## Grouped human delivery authorization

`authorizations.mjs` lets one explicit human decision cover one contiguous,
candidate-specific delivery sequence without granting standing authority. The
only possible actions are `commit_candidate`, `push_branch` and
`create_draft_pull_request`. A bundle binds the repository identity, candidate
id, base SHA, one `codex/` branch, exact sorted paths, activation digest,
required checks, order and expiry. Paths are never expanded: bracketed Next.js
segments remain literal, while `*`, `?` and brace patterns are rejected. The
bundle lasts at most 24 hours and contains no merge, deployment,
publication, deletion or destructive rollback action.

The delivery controller must stage authorized paths with Git's literal pathspec
mode, for example `git --literal-pathspecs add -- <exact paths>`. Quoting a path
in the shell is insufficient because Git otherwise interprets bracketed route
segments as character classes. The committed `changedPaths` must still match the
bundle exactly before push authority can be reserved.

The controller validates and reserves each next step immediately before the
external action. A reservation lasts at most 10 minutes and its raw random token
is never persisted. The typed check evidence is retained with the reservation;
completion consumes the token and records the exact commit, push or draft PR
result in an append-only chain. Reservations are single-use:
expiry, drift, corruption, a fork or a failed result stops the bundle and never
causes automatic retry or reclaim. Revocation requires a fresh human decision.

This is a narrow alternative to the still-false standing commit, push and draft
PR flags. It does not allow the builder to use Git and a scheduled cycle cannot
invent or register a grant. A human-authorized controller must provide the
typed gate evidence. Recoverability of an outcome does not itself authorize a
rollback.

Learned rules are retained only as quarantined proposals. They are not placed in
the agent context and cannot edit prompts, policy or code. Promotion remains a
separate human-reviewed repository change.

Useful commands:

```sh
node automation/agents/runtime.mjs exec -- node automation/agents/memory.mjs status
node automation/agents/runtime.mjs exec -- node automation/agents/memory.mjs context --base-sha "$(git rev-parse HEAD)"
node automation/agents/runtime.mjs exec -- node automation/agents/memory.mjs record --file report.json
node automation/agents/runtime.mjs exec -- node automation/agents/reconcile.mjs list
node automation/agents/runtime.mjs exec -- node automation/agents/operations.mjs status
node automation/agents/runtime.mjs exec -- node automation/agents/authorizations.mjs status
```

## Current mode

`policy.json` is currently `active` only for isolated local diffs after three
reviewed shadow canaries converged safely. `allowLocalDiff` is true, while
commit, push, draft PR, merge, deployment and publication remain false. The
separate grouped-authorization facility can cover only one exact human-approved
delivery sequence; it does not change those standing flags. The
pre-tool hook still denies the builder unless both active mode and local-diff
authority are present, and it cannot use Git, network or protected paths.

The project `.codex/config.toml` replaces the unsafe global default with writes
limited to the workspace and the private coordination namespace, with no shell
network. Custom-agent hooks add a second, deterministic block for Git mutation,
dependency installation, external tools and every path in `protectedPaths`. In
active mode, the builder may write only through `apply_patch`, only to canonical
paths explicitly present in its manifest.

Policy limits have explicit enforcement owners:

| Limit | Enforcement |
|---|---|
| concurrent writers | machine-shared atomic lease keyed by normalized `origin` |
| pending local diffs | effective append-only claim state blocks a second writer; awaiting-review claims also enforce the pending limit |
| findings | response contract validator |
| changed files and diff lines | deterministic diff policy |
| run time | Codex `job_max_runtime_seconds` plus the director deadline |
| correction iterations | director state machine; the auditor never repairs |
| lease TTL | investigation signal only; stale leases are never auto-reclaimed |
| active system PRs | `reconcile.mjs` compares exact Git/PR identity before any PR action |
| grouped delivery | immutable human bundle plus single-use append-only reservations |

The last three are orchestration gates rather than claims of enforcement by the
filesystem hook. With PR authority disabled in shadow, their safe result is a
block or no-op.

## Manual canary

Run from a clean isolated worktree:

```sh
node automation/agents/runtime.mjs exec -- node automation/agents/policy.mjs
node automation/agents/runtime.mjs exec -- node automation/agents/preflight.mjs --json
node automation/agents/runtime.mjs exec -- npm run check:diff
node automation/agents/runtime.mjs exec -- npm run check:activation -- --json
```

Then invoke `$obraxen-continuous-improvement` with a request to run one shadow
cycle. Inspect its structured finding report and verify that it created no diff.
For a model-availability canary, invoke the exact specialist role rather than a
default agent, require the `spawn_agent` child id, and validate the returned JSON
with `contracts.mjs --role <role>`. Static configuration and prose cannot prove
that the configured account accepts the model.

`preflight.mjs` is read-only with respect to the repository, but it updates the
current clone's heartbeat in the private coordination registry outside the
checkout. Production CLI calls take one governed state home from
`policy.json`, currently `~/.local/state`, and report the resolved repository
state root. The project sandbox grants write access only to its
`~/.local/state/obraxen` namespace in addition to the current workspace. Project
configuration applies only after the checkout has been marked as trusted.

There is intentionally no per-run environment or CLI override. Changing the
governed state home is a protocol migration: stop every runner, update the
protected policy and matching `sandbox_workspace_write.writable_roots`, migrate
or explicitly retire the old registry, verify every clone, and only then resume
writers. Never select a clone-local directory, because independent clones must
continue to share one registry and writer lease. Relative, empty or
whitespace-padded policy values fail closed. Tests inject isolated absolute
roots only through the module API.

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
operational events, clone bindings and stale leases are never removed or
reclaimed automatically; inspect the associated process, worktree, Git status,
effective claim state and evidence before a human removes any of that state.

Protocol version 3 is an explicit cutover gate. Acquisition is denied while any
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

Standing autonomous authority stops at step 4. A local diff must pass the
complete gate and independent audit, then remain available for human review.
It can leave the machine only when a separate exact human bundle is registered
and consumed by the controller; the scheduled builder still cannot do so.

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
