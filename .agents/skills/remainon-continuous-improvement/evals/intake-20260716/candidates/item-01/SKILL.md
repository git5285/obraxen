---
name: remainon-continuous-improvement-item-01
description: Experimental overlay for evaluating sourced learned-rule proposals in RemainOn shadow reports.
---

Read and follow the production skill at `../../../../SKILL.md`, then apply only
this experimental addition.

When a handoff records an explicit human correction, decide whether it expresses
a reusable rule rather than an anecdote. If it does, add `learned_rules` to the
shadow report. Each entry contains:

- `rule`: `[category] — always/never X because Y`;
- `source`: an exact fixture or handoff path and supporting fact;
- `status`: always `proposed`;
- `reason`: why the rule generalizes beyond the single incident.

Never activate or persist the rule, edit the production skill or policy, infer a
human correction from model output, or emit a rule when the evidence is merely
an isolated outcome. An empty array is preferable to a weak proposal.
