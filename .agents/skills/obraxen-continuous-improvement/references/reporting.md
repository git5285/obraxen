# Cycle reporting

This contract applies to actual controlled cycles, not capability questions,
prompt drafts or standalone owner maintenance. Existing schema and persistence
rules remain unchanged. Commands run from the repository root.

## Final report

Classify the execution source before building the report:

- `scheduled_autonomous`: a scheduled controller wake-up that selects and runs
  work without a human request for that cycle;
- `human_directed`: an explicit human request or human-started candidate
  continuation;
- `control_plane_maintenance`: work on agent policy, contracts, prompts,
  coordination, memory, evaluation or delivery controls;
- `delivery`: commit, push, draft-PR, reconciliation or operational closure
  work for an existing candidate.

`trigger` describes how this phase began and `runOrigin` describes whose work
it is. `scheduled_cycle` requires `scheduled_autonomous`, `human_request`
requires `human_directed` or `control_plane_maintenance`, and `delivery_event`
requires `delivery`; `candidate_follow_up` may retain any origin. Never label
human-directed, maintenance or delivery work as autonomous. Only
`scheduled_autonomous` contributes to autonomous-effectiveness metrics.

Classify the work separately from its origin:

- `product`: evidence, UX, accessibility, SEO, localization and performance;
- `reliability`: security, testing, reliability and maintainability outside the
  agent control plane;
- `agent_maintenance`: any finding whose candidate paths match the agent path
  patterns in policy, regardless of its domain.

The policy sequence is ten scheduled cycles: seven `product`, two
`reliability` and one `agent_maintenance`. Recording a scheduled `no_op` still
consumes its slot. Never repeat a slot or change class because no candidate was
found.

Return exactly one JSON object containing:

- `schemaVersion`: `6`;
- `status`: `no_op`, `shadow_finding`, `blocked`, `local_diff`, or `draft_pr`;
- `mode`, `runOrigin`, `attentionClass`, `runId`, `baseSha`,
  `runtimeFingerprint`;
- `candidateId`: the stable candidate identifier, or `null` without a selected
  finding;
- `parentRunId`: the immediately preceding run for that candidate, or `null`
  for its first phase;
- `trigger`: `scheduled_cycle`, `human_request`, `candidate_follow_up`, or
  `delivery_event`;
- `phase`: `discovery`, `implementation`, `review`, `delivery`, `closure`, or
  `null` without a selected finding;
- `finalCommit`: the declared 40-character commit SHA when one exists, or
  `null`;
- `pullRequest`: `{number, url}` when one exists, or `null`;
- `reviewDecision`: `approved`, `changes_requested`, `rejected`, `superseded`,
  or `null`;
- `selectedFinding`: the complete selected scout finding, or `null`;
- `activeConflicts`, `policyBlockers` and `changedPaths` arrays;
- `checks`: objects with `command`, `status` and `summary`;
- `auditorVerdict`: `pass`, `veto`, `needs_human`, or `null`;
- `externalAction`: `none`, `local_diff`, or `draft_pr`;
- `learned_rules`: sourced rule proposals, or an empty array (see below);
- `usage`: measured `inputTokens`, `outputTokens`, `totalTokens`, `costUsd`
  and `durationMs`, using `null` rather than estimates;
- `traceId`: the runtime trace identifier, or `null`;
- `reason`: the outcome and exact next human decision, if one exists.

Validate and persist the final object atomically:

```sh
node automation/agents/runtime.mjs exec -- node automation/agents/memory.mjs record --file -
```

Pipe the exact JSON report through standard input. Do not record prose, partial
reports or role output. A repeated `runId` is idempotent only when every report
field is identical; conflicting reuse is a blocked run. Memory validates the
scheduled attention slot before writing and advances it for valid `no_op`
reports as well as findings and diffs.

Candidate phases are monotonic and form one chain: every continuation points to
the exact previous `runId`. `finalCommit`, `pullRequest` and `reviewDecision`
are recorded declarations in this phase; live Git and PR reconciliation is a
separate gate and must not be inferred from these fields.

Never claim continuous operation merely because a single cycle completed.

### Learned rules

When a handoff records an explicit human correction, decide whether it expresses
a reusable rule rather than an anecdote. Only then add a `learned_rules` entry:

- `rule`: `[category] — always/never X because Y`;
- `source`: the exact handoff or fixture path plus the supporting fact;
- `status`: always `proposed`;
- `reason`: why the rule generalizes beyond the single incident.

Never activate a proposed rule, edit this skill or the policy from a rule,
infer a human correction from model output, or emit a rule when the evidence is
an isolated outcome. Memory may retain it only as a quarantined proposal; it is
never included as an instruction in future context. An empty array is
preferable to a weak proposal. Promoting a proposed rule into durable behavior
is always a separate human-reviewed change.
