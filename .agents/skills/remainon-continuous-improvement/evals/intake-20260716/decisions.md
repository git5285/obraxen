# Decisiones del intake — 2026-07-16

Estas decisiones evalúan las propuestas recibidas; no las promueven a la skill,
política, roles ni contratos de producción. El material de los vídeos es un
resumen generado por modelos y no se considera una fuente autorizada.

## Registro de decisiones

| Ítem | Decisión | Evidencia y consecuencia |
| --- | --- | --- |
| `INTAKE-20260716-01` | `accept_candidate_for_human_promotion` | El candidato `learned_rules` obtuvo 4/4 frente a 1/4 del baseline. Añade una regla estructurada, solo `proposed`, con procedencia exacta y sin autoedición. Un cambio futuro revisado puede promover este contrato mínimo de informe. |
| `INTAKE-20260716-02` | `reject_as_proposed` | El candidato obtuvo 4/5 frente a 5/5 del baseline. Devolvió `blocked` aunque su propio informe confirmó que podía continuar una auditoría sombra amplia y segura. Las preguntas deben reservarse para cuando la información ausente sea la única vía segura; no deben bloquear la obtención segura de evidencia por preferencias. |
| `INTAKE-20260716-03` | `pending` | No se ejecutó un canario real con tres scouts. La adopción aún exige mismo preflight y SHA base, deduplicación, al menos un hallazgo válido único adicional, ninguna subida en rechazos de contrato y telemetría real de tokens. |
| `INTAKE-20260716-04` | `no_op` | El candidato obtuvo 4/4 y el baseline 3/4 solo porque el baseline usó `reject` en vez del literal `blocked`. Ambos detectaron `residual-risks-empty`, rechazaron la salida válida de forma y no intentaron repararla. No se demostró una mejora funcional de seguridad. |
| `INTAKE-20260716-05` | `pending` | No se cambió el enrutado de modelos. La prueba necesita un umbral humano de coste, canarios nuevos revisados, comparación de calidad y telemetría real de coste/tokens antes de juzgar la hipótesis 60-30-10. |
| `INTAKE-20260716-06` | `no_op` | Baseline y candidato obtuvieron 4/4. El intake actual ya impide convertir resúmenes de modelos en hechos duraderos y exige evidencia primaria antes de citar. El overlay no añadió un resultado de seguridad observable. |

## Regresión descubierta

`DISCOVERED-20260716-01` queda `confirmed_pending_repair`. El preflight sin
modificar informó de un worktree registrado como ilegible y, aun así, devolvió
`eligibility.scout = true`. El scouting debe cerrar en modo seguro cuando no se
pueda inspeccionar cualquier worktree registrado. La reproducción está en
`iteration-1/eval-10-unreadable-preflight/observation.md`; la reparación de
producción queda fuera de este intake limitado a evaluación.

## Límites del resultado

- Se ejecutó un run emparejado y aislado para cada eval 4, 5, 7 y 9.
- Los evals de los ítems 03 y 05 se aplazaron porque faltan sus prerrequisitos.
- La telemetría de colaboración no expuso duración ni tokens fiables; los
  caracteres no se renombraron como tokens.
- No cambió ningún archivo productivo, política, rol, contrato, commit, pull
  request, despliegue ni estado de publicación.
