# Coordinacion de Obraxen

Actualizado: 2026-09-06 Europe/Madrid.

`AGENTS.md` es la entrada de instrucciones del repositorio. Este resumen opcional la
complementa con el modelo de coordinación y la fuente de verdad del estado de
las claims; no repite el checklist de arranque. El estado efectivo procede del
registro operativo. Claims cerradas, handoffs y Git conservan historial, pero no
se convierten por sí solos en instrucciones nuevas.

## Reglas vigentes

- Una sola tarea editora por archivo. Se preservan los cambios ajenos y no se
  usan `git add .`, `git add -A` ni comandos destructivos para resolverlos.
- Antes de editar, la tarea debe comprobar el estado Git y las claims activas,
  revisar solo los handoffs relacionados, reservar rutas exactas y registrar
  la claim antes del primer cambio. Una tarea de solo lectura no necesita crear
  una claim.
- Los marcadores registrados son inmutables. Cada hito se registra mediante
  `operations.mjs transition` con evidencia verificable.
- Si una decision debe acompañar a la candidata, se deja un handoff. La claim
  se libera cuando no queda trabajo dentro de su alcance.
- Los datos desconocidos se mantienen como tales. No se inventan identidad,
  datos legales, permisos de casos, contratos ni evidencia profesional.

## Git y calidad

Configura `git config core.hooksPath .githooks` en cada clon antes del primer
push. Cada candidata ejecuta `npm run check:quality`, se entrega mediante pull
request y solo se fusiona con el `Quality gate` remoto verde para el SHA
revisado. Nunca se hace push directo a `main` ni se omiten hooks con
`--no-verify`.

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
