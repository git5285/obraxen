# Coordinacion de Obraxen

Actualizado: 2026-09-06 Europe/Madrid.

`AGENTS.md` es la entrada de instrucciones del repositorio. Este resumen opcional la
complementa con el modelo de coordinación y la fuente de verdad del estado de
las claims; no repite el checklist de arranque. El estado efectivo procede del
registro operativo. Claims cerradas, handoffs y Git conservan historial, pero no
se convierten por sí solos en instrucciones nuevas.

## Reglas y calidad

`AGENTS.md` define las reglas obligatorias de propiedad, preservación de
cambios, evidencia, Git y calidad. `.coordination/README.md` define la mecánica
de registro, transición y entrega. Una tarea de solo lectura no crea claim.
El registro operativo es la fuente del estado efectivo; el historial no
concede nueva autoridad.

## Limites de activacion

No hay despliegue, publicacion, seleccion de naming, compra ni cambio legal sin
autorizacion humana expresa y evidencia suficiente. La activacion publica se
consulta con `npm run check:activation -- --json`; un resultado `NO-GO` bloquea
la publicacion aunque el resto de checks tecnicos pasen.

## Referencias

- Sintaxis y ciclo de claims: `.coordination/README.md`.
- Estado vivo y evidencia: `automation/agents/operations.mjs status`.
- Politica, runtime y gates: `automation/agents/`.
- Historial de entregas: `.coordination/claims/`, `.coordination/handoffs/` y
  `git log`.
