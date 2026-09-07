# Estado operativo actual

Actualizado: 2026-09-07 Europe/Madrid, sobre `main` en
`8ece5fcd296d93536e673a030f699eda56f4947f`.

Este resumen orienta el arranque; no sustituye el registro operativo. Antes de
editar, ejecuta:

```sh
node automation/agents/runtime.mjs exec -- \
  node automation/agents/operations.mjs status
```

## Estado comprobado

- El checkout principal y `origin/main` coinciden en el SHA indicado al
  actualizar este documento: `8ece5fcd296d93536e673a030f699eda56f4947f`.
- Las claims y el lease no se resumen como estado persistente: se consultan en
  cada inicio con `operations.mjs status`.
- El runtime gobernado exige Node `24.18.0` y npm `11.16.0`; los comandos de
  proyecto se ejecutan mediante `automation/agents/runtime.mjs`.
- El sitio sigue en `NO-GO` para activacion publica. Los checks tecnicos no
  sustituyen evidencia legal, de naming, de proveedor, linguistica ni de
  permisos de casos.

## Trabajo pendiente no inferible

La activacion depende de decisiones y documentos externos que no se fabrican en
el repositorio. Consulta `ACTIVATION_GATE.md` y el resultado actual de
`npm run check:activation -- --json` antes de planificar cualquier publicacion.

## Higiene de candidatos

Los worktrees o ramas historicos no son parte de `main` y se auditan de forma
aislada antes de reutilizar o retirar sus cambios. No se mezclan con una nueva
candidata por tener nombres o rutas parecidas.
