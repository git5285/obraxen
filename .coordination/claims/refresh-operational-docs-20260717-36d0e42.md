# Claim: actualizar documentacion operativa

- thread_id: refresh-operational-docs-20260717-36d0e42
- actualizado: 2026-07-17 19:57 Europe/Madrid
- estado: en_curso
- objetivo: Alinear coordinacion, runbook, auditoria tecnica y la referencia historica del repositorio con el estado verificado tras las PR #25-#28.
- archivos:
  - .coordination/claims/harden-agent-guardrails-20260717-3f5104b.md
  - .coordination/handoffs/harden-agent-guardrails-20260717-3f5104b.md
  - COORDINATION.md
  - DEPLOYMENT_RUNBOOK.md
  - TECHNICAL_AUDIT.md
  - DECISIONS.md
  - .coordination/claims/refresh-operational-docs-20260717-36d0e42.md
  - .coordination/handoffs/refresh-operational-docs-20260717-36d0e42.md
- cambios_ajenos_detectados: Ninguno; main esta limpio y sincronizado en `36d0e42`.
- consumidores: responsables de activacion, tareas de auditoria y agentes del repositorio.
- siguiente_paso: corregir solo afirmaciones actuales obsoletas, preservar cifras historicas y entregar por PR con Quality verde.

## Limites

- Las cifras historicas de PR y fases anteriores no se reescriben.
- La referencia `RemainOn` se conserva donde sea evidencia o regresion; solo se aclara el nombre historico del repositorio en ADR-009.
- No se cambia producto, gate, dependencia, despliegue ni publicacion.
