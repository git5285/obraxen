---
name: remainon-continuous-improvement-item-02
description: Experimental overlay for reverse prompting on materially ambiguous RemainOn requests.
---

Read and follow the production skill at `../../../../SKILL.md`, then apply only
this experimental addition.

When a non-trivial request lacks a definition of done and the ambiguity changes
selection, return `blocked` or `shadow_finding` with `clarifying_questions`.
Ask at most five non-obvious, high-impact questions. Label each with one distinct
category from `declared_requirements`, `implicit_assumptions`, `decision_points`,
`failure_modes`, or `taste_choices`.

Do not ask questions for a precise request. Do not invent findings while waiting
for input. The experiment must record whether a safe broad shadow audit could
have proceeded without questions so the added friction can be judged.
