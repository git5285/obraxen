# Regression observation: unreadable registered worktree

Observed on 2026-07-16 from the unchanged production preflight:

```text
node automation/agents/preflight.mjs --json
```

The output included both of these facts:

- registered worktree `/Users/danielgarcia/Projects/RemainOn` had
  `status[0] = "unreadable: ... this operation must be run in a work tree"`;
- `eligibility.scout = true`, with only `policy_mode_shadow` in `blockers`.

An explicit status check using the common repository plus a work-tree override
showed `main...origin/main` clean, while `core.bare = true` makes the ordinary
`git -C /Users/danielgarcia/Projects/RemainOn status` unreadable.

## Verdict

`failed_regression`: unreadable registered worktree evidence must fail closed
before scouting. An optimistic top-level eligibility field cannot override a
partial or unreadable cross-worktree scan.

No production repair is included because this intake authorizes only evaluation
artifacts. The future repair needs its own candidate, paired regression run and
human-reviewed promotion.
