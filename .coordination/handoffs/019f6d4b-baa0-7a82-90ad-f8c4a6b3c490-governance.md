# Handoff: coordinación compartida entre clones

- thread_id: `019f6d4b-baa0-7a82-90ad-f8c4a6b3c490`
- terminado: `2026-07-17 12:15 CEST`
- resultado: protocolo v3 implementado localmente; pendiente revisión humana y corte de dos consumidores legacy.
- archivos_cambiados: `.coordination/README.md`, `automation/agents/README.md`, `automation/agents/lease.mjs`, `automation/agents/lease.d.mts`, `automation/agents/preflight.mjs`, `automation/agents/preflight.d.mts`, `tests/agents/lease.test.ts`, `tests/agents/preflight.test.ts`.
- commits_tecnicos: `f4be03b17deeb33dbd4be29cbc9cf7a80bf8a573`, `5cb3e1b4080131073ee92e5673f17af472b45879`, `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.

## Verificaciones

- Node: `v24.14.0` desde el runtime incluido de Codex; el proyecto exige `24.x`.
- Regresiones focalizadas: 40/40.
- `npm run check:quality` sobre `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`: 187 unitarias, 52 páginas compiladas, 2 E2E de contacto, 89 E2E estándar, 8 omisiones previstas y Lighthouse OK en 3 rutas.
- npm 12 emitió una advertencia de compatibilidad con Node `v24.14.0` porque declara soporte desde `v24.15.0`; no falló ninguna comprobación y el proyecto exige `24.x`.
- `npm run check:activation -- --json`: base `e9e7818` y candidata mantienen `NO-GO`, 36 bloqueos y publicación no autorizada.
- Preflight real: principal y runner registrados; runner y CTA detectados como worktrees legacy; `scout=false`, `writer=false`; sin lease compartida ni legacy.
- Adquisición directa: rechazada por protocolo incompatible antes de crear `owner`.
- `git diff --check`: pasa.
- Diff policy autónoma: veto esperado por más de 400 líneas y seis superficies protegidas; no se debilitó ni se eludió.
- Reauditoría adversarial de `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`: no encontró bypass técnico material en lease, identidad, cutover ni parser de claims; el veto se limitó a que la claim y este handoff aún citaban `5cb3e1b` y 39/186, defecto de trazabilidad corregido aquí.

## Decisiones

- El estado compartido vive en la raíz privada fija del usuario y se indexa por `origin` normalizado.
- Binding inmutable, registro reconciliado, leases legacy, versión por worktree, operaciones serializadas y tokens de un solo uso fallan cerrado.
- Toda claim no liberada bloquea un segundo writer; metadatos duplicados, desconocidos o sin rutas también bloquean.
- Los dos entornos legacy se preservaron sin modificación. No se permite despliegue mixto.

## Pendiente

- Revisión humana del cambio protegido y de tamaño superior al límite autónomo.
- Planificar y autorizar por separado la actualización o retirada secuencial de runner y CTA.
- Sin push, PR, fusión, despliegue ni publicación.

- mensaje_enviado_a: tarea actual de Codex.
