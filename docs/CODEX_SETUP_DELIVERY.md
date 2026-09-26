# Candidata de consolidación del setup

Recuperada el 26 de septiembre de 2026 desde el parche y manifiesto conservados;
los 15 archivos recuperados coincidieron con sus hashes originales.

Preparada el 25 de septiembre de 2026 para la petición humana de consolidar las
mejoras, verificar una sesión nueva y observar las próximas tareas.

## Candidata

- Rama local: `codex/setup-consolidation-20260925`.
- Base: `470cb2ce4e3b64a74836ce5796a6f8e87741cdfb`, coincidente con el `main`
  remoto consultado durante la preparación.
- Checkout: `/private/tmp/obraxen-setup-delivery-01a0d561`.
- Control preservado: `/Users/danielgarcia/Projects/Obraxen`.
- Sin commit, push, PR, merge ni despliegue en esta entrega local.

Se trasladaron las cuatro mejoras de la tarea anterior mediante su delta,
conservando la retirada del legado y `operations.mjs status --active` integrados
en la base más reciente. No se copió el checkout antiguo sobre `main`.
Las tres pruebas nuevas están incluidas en `tests/unit-test-groups.json`.
Las dependencias de validación se copiaron a un directorio propio de la candidata
desde un checkout con el mismo lockfile; no se comparten mediante un symlink.

## Cambios

1. Contexto compacto por tarea con checksum de la claim antes de presentar sus
   metadatos; conserva las comprobaciones de checkout, HEAD y estado completo.
2. `local-task start/finish` agrupa la mecánica existente de coordinación local,
   manteniendo conflictos, runtime, claims inmutables y evidencia de cierre.
3. El builder acepta `lint:home` y `test:home` mediante el runtime fijado, sin
   argumentos adicionales ni nuevas facultades remotas.
4. El hook de diseño filtra los archivos UI, separa los parches mixtos y usa un
   plazo total de 3,5 segundos. No hay hook global de diseño en `Stop`.

## Sesión nueva: resultado observado

Se iniciaron dos procesos nuevos de Codex Desktop 0.155.0-alpha.16.3 y sendas
sesiones efímeras: una desde el control y otra desde la candidata. Se consultó
`hooks/list` y se cerraron los procesos. No se solicitaron turnos de modelo,
herramientas de agente ni cambios de confianza durante esta comprobación.

Ambas sesiones descubren la configuración de hooks del control. La candidata
carga su propio `AGENTS.md`. No se observaron errores de carga.

| Hook | Estado observado |
| --- | --- |
| `node .codex/hooks/pre-tool-policy.mjs` | enabled, trusted |
| `node .codex/hooks/design-scope.mjs` | enabled, trusted (revalidado el 26 de septiembre) |

La consulta a un proceso nuevo del 26 de septiembre confirma la definición confiable. Hash:
`sha256:c4ff8f74f87a7776562b04101784e7254918256b9c731a0e00ec9729897967a4`.
El descubrimiento por sí solo no demuestra ejecución automática. La documentación oficial explica la revisión por hash en
[Hooks: review and trust](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks).
No se usa una opción de bypass ni se modifica silenciosamente la confianza.

El 26 de septiembre se verificó además la ejecución automática en una sesión
efímera: un proveedor determinista local emitió una llamada `apply_patch` que
añadió la nota de recuperación de este documento. El runtime real de Codex
emitió `hook/started` y `hook/completed` para PreToolUse y PostToolUse, ambos
con estado `completed`; el cambio quedó guardado. No hubo inferencia de modelo,
peticiones a proveedores externos ni cambios de confianza. Esta prueba acredita
el despacho automático y el filtro silencioso ante documentación, no una
revisión visual de la Home. El filtrado UI se cubre por las pruebas unitarias.

Evidencia: `~/.local/state/obraxen/four-pending-01a0dd7b/fresh-hooks-list.json`
y `hook-runtime-probe.json` en el mismo directorio.

## Validación

Ejecutar los comandos de proyecto mediante `node automation/agents/runtime.mjs exec --`.

- `npm run check:agent-runtime`: correcto, Node 24.18.0 y npm 11.16.0.
- `npm run lint`: exit 0; conserva el aviso existente de ESLint sobre la ausencia
  de `pages/` tras la retirada del legado.
- `npm run typecheck`: exit 0.
- `npm run test:tooling`: correcto, incluyendo las tres pruebas nuevas.
- `npm run test:home`: 69 pruebas aprobadas.
- `npm run build`: correcto; rutas estáticas `/`, `/de`, `/en` y not-found.
- Revisión independiente de integración: sin bloqueos; no revierte cambios de
  main ni arrastra archivos de otras tareas.

Logs y atestaciones locales:
`~/.local/state/obraxen/setup-delivery-01a0d561/` (evidencia conservada) y
`~/.local/state/obraxen/four-pending-01a0dd7b/` (recuperación y prueba del runtime).
El gate completo, la auditoría de dependencias y CI no se presentan como
ejecutados. Una entrega Git posterior requiere sus autorizaciones y checks.

## Observación

Seguimiento activo en esta conversación: `observar-cinco-tareas-de-obraxen`.
Cada seis horas observa las próximas cinco tareas humanas distintas, con fecha
límite del 9 de octubre. No publica actualizaciones periódicas ni ejecuta trabajo
de producto. El informe futuro distinguirá datos medidos y ausentes; todavía no
existe una muestra que demuestre ahorro de tiempo o tokens.

Protocolo: [CODEX_SETUP_OBSERVATION.md](CODEX_SETUP_OBSERVATION.md).
Estado privado: `~/.local/state/obraxen/setup-observation-01a0d561/state.json`.
El seguimiento notifica al terminar y se pausa.

## Pendiente

La candidata local está recuperada y validada: lint, tipos, 589 pruebas tooling,
69 pruebas Home y build correctos el 26 de septiembre; ejecución automática del
hook verificada mediante el runtime. La integración remota requiere autorización
separada. La observación de cinco tareas sigue su calendario: no se sustituyen
tareas reales por pruebas deterministas ni se atribuyen ahorros sin una muestra.
