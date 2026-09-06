# Coordinacion de Obraxen

Actualizado: 2026-09-06 Europe/Madrid.

Este documento contiene las reglas vigentes. El estado de una claim procede del
registro operativo; los handoffs, las claims cerradas y Git conservan el
historial sin convertirlo en instrucciones de arranque.

## Antes de editar

1. Lee `AGENTS.md`, este archivo y `.coordination/README.md`.
2. Ejecuta `git status --short` y consulta el estado efectivo con:

   ```sh
   node automation/agents/runtime.mjs exec -- \
     node automation/agents/operations.mjs status
   ```

3. Revisa los handoffs relacionados y crea una claim con rutas exactas en el
   worktree de control.
4. Registra la claim con `operations.mjs register` antes del primer cambio.

## Reglas vigentes

- Una sola tarea editora por archivo. Se preservan los cambios ajenos y no se
  usan `git add .`, `git add -A` ni comandos destructivos para resolverlos.
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
