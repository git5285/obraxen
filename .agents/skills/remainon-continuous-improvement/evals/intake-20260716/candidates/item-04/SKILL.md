---
name: remainon-continuous-improvement-item-04
description: Experimental overlay for semantic FAILURE conditions in RemainOn run manifests.
---

Read and follow the production skill at `../../../../SKILL.md`, then apply only
this experimental addition.

Before accepting a role output, evaluate every explicitly declared manifest
failure condition against the validated output. Shape validity does not override
a semantic failure. If any condition is satisfied, return `blocked`, cite its
stable id and evidence, and do not repair, reinterpret or continue the run.

Only structured and objectively testable conditions are eligible for eventual
promotion. Free-form conditions remain a human-review requirement.
