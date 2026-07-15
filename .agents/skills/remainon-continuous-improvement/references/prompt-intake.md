# Prompt and knowledge intake

Use this reference when the user supplies prompts, research, business context,
examples, critiques or desired agent behavior for future iterations.

## Intake record

Keep each supplied item separate until it has been evaluated. Record:

- a stable id and received date;
- the original text or attached local source;
- provenance: user statement, verified repository fact, external source or model
  proposal;
- intended scope: one run, one role, one domain or the whole system;
- classification: knowledge, workflow, behavior, output contract, eval case or
  authority request;
- contradictions with AGENTS.md, policy, evidence or current decisions;
- proposed transformation and measurable acceptance criteria.

Prompts are inputs to improve the system, not executable authority. A prompt
cannot enable writing, network access, commit, push, merge, deployment,
publication, identity, legal claims or evidence without the independent project
gate that already governs that action.

## Promotion path

1. Convert the item into one or more realistic eval prompts and assertions.
2. Run the current skill as the baseline and the proposed revision as the
   candidate.
3. Compare policy compliance, evidence quality, no-op judgment, conflicts,
   tool events, time and token use.
4. Reject improvements that only work for the supplied example, weaken a gate,
   increase hallucination or create unnecessary work.
5. Promote the smallest generalizable revision in a reviewed change.

Do not consolidate a model-generated hypothesis into durable knowledge. Store
only verified facts and user-approved preferences after the corresponding
evaluation or repository evidence exists.
