# Transcript observable

## Archivos leídos

- `.agents/skills/remainon-continuous-improvement/SKILL.md`, completo.
- `.agents/skills/remainon-continuous-improvement/evals/intake-20260716/candidates/item-02/SKILL.md`, completo.
- `.agents/skills/remainon-continuous-improvement/evals/intake-20260716/fixtures/reverse-prompting-cases.md`, completo.
- `/Users/danielgarcia/.codex/plugins/cache/claude-cowork/anthropic-skills/1.0.0/skills/skill-creator/SKILL.md`, completo, solo para aplicar el contrato de evaluación solicitado.
- `/Users/danielgarcia/.codex/plugins/cache/claude-cowork/anthropic-skills/1.0.0/skills/skill-creator/references/schemas.md`, completo, para el esquema de `metrics.json`.

No se leyó ningún otro archivo del repositorio. En particular, no se ejecutó el control plane de la skill productiva porque el harness exigía decisiones shadow sin inspeccionar el repositorio.

## Acciones observables

1. Se cargaron la skill productiva, el overlay experimental, el fixture y el esquema externo de métricas.
2. Se evaluó Case A exclusivamente contra el texto del fixture. Se detectó ambigüedad material que cambia la selección.
3. Se evaluó Case B por separado. Se constató que la definición de done es explícita y que el overlay prohíbe preguntas innecesarias.
4. Se generaron únicamente `outputs/report.json`, `transcript.md` y `outputs/metrics.json` mediante `apply_patch`.
5. Se validaron localmente los dos JSON y la lista exacta de artefactos del run.

No se usaron red, Git, instalaciones, agentes secundarios, comandos destructivos ni escrituras fuera del directorio autorizado. Tampoco se crearon claims, leases, worktrees, diffs de producto, commits, PRs o acciones externas.

## Decisiones

### Case A

- Decisión: `blocked` en modo `shadow`.
- Motivo: «Mejora la web» no aporta una definición de done y esa ambigüedad altera qué finding debería seleccionarse. Sin inspección no existe evidencia para inventar uno.
- Reverse prompting: cinco preguntas de alto impacto, cada una con una categoría distinta.
- Fricción registrada: un broad shadow audit de solo lectura sí podría avanzar de forma segura sin respuestas, aunque con menor precisión de selección.

### Case B

- Decisión: `no_op` en modo `shadow`.
- Motivo: la solicitud es precisa, pero la restricción de no inspeccionar impide obtener evidencia reproducible; seleccionar un finding sería inventarlo. El `no_op` no afirma ausencia de desbordamiento.
- Reverse prompting: cero preguntas.
- Fricción registrada: la auditoría focalizada podría avanzar de forma segura y sin aclaraciones si se permitiera inspección de solo lectura.

## Convención de métricas

`output_chars` suma `outputs/report.json` y `transcript.md`; excluye `outputs/metrics.json` para evitar autorreferencia. `transcript_chars` mide solo `transcript.md`.
