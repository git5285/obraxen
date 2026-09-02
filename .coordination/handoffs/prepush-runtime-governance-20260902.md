# Handoff: runtime gobernado en pre-push

- thread_id: prepush-runtime-governance-20260902
- base: eb50df686bf0cee0b4e4d3a91c9ed7ed3c323c74
- resultado: El hook delega `check:diff` y `check:quality` en `automation/agents/runtime.mjs exec` para seleccionar el Node y npm fijados por el repositorio.
- causa: El hook invocaba el npm del entorno de Git, que resolvio Node 24.19.0 y npm 11.17.0 en vez del contrato 24.18.0 y 11.16.0.
- archivos_cambiados: `.githooks/pre-push`
- verificaciones: `sh -n .githooks/pre-push`; `tests/agents/git-hook.test.ts` (2 pruebas); ejecucion simulada del hook con `check:diff` y `check:quality` en verde (278 unitarias, 2 E2E de contacto, 89 E2E generales y Lighthouse); activacion `NO-GO` con 24 bloqueos sin cambios.
- pendiente: Entregar la candidata solo con una autorizacion agrupada nueva; no hay push ni PR autorizados.
