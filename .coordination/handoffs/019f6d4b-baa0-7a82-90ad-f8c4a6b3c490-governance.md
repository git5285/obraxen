# Handoff: coordinación compartida entre clones

- thread_id: `019f6d4b-baa0-7a82-90ad-f8c4a6b3c490`
- terminado: `2026-07-17 12:34 CEST`
- resultado: protocolo v3 implementado y corte local completado; promoción manual a PR borrador autorizada y en curso.
- archivos_cambiados: `.coordination/README.md`, `automation/agents/README.md`, `automation/agents/lease.mjs`, `automation/agents/lease.d.mts`, `automation/agents/preflight.mjs`, `automation/agents/preflight.d.mts`, `tests/agents/lease.test.ts`, `tests/agents/preflight.test.ts`, `.coordination/claims/019f6d4b-baa0-7a82-90ad-f8c4a6b3c490-governance.md`, `.coordination/handoffs/019f6d4b-baa0-7a82-90ad-f8c4a6b3c490-governance.md`.
- commits_tecnicos: `f4be03b17deeb33dbd4be29cbc9cf7a80bf8a573`, `5cb3e1b4080131073ee92e5673f17af472b45879`, `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.

## Verificaciones

- Node: `v24.14.0` desde el runtime incluido de Codex; el proyecto exige `24.x`.
- Regresiones focalizadas: 40/40.
- `npm run check:quality` sobre `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`: 187 unitarias, 52 páginas compiladas, 2 E2E de contacto, 89 E2E estándar, 8 omisiones previstas y Lighthouse OK en 3 rutas.
- npm 12 emitió una advertencia de compatibilidad con Node `v24.14.0` porque declara soporte desde `v24.15.0`; no falló ninguna comprobación y el proyecto exige `24.x`.
- `npm run check:activation -- --json`: base `e9e7818` y candidata mantienen `NO-GO`, 36 bloqueos y publicación no autorizada.
- Preflight anterior al corte: principal y runner registrados; runner y CTA detectados como worktrees legacy; `scout=false`, `writer=false`; sin lease compartida ni legacy.
- Adquisición directa: rechazada por protocolo incompatible antes de crear `owner`.
- `git diff --check`: pasa.
- Diff policy autónoma: veto esperado por más de 400 líneas y seis superficies protegidas; no se debilitó ni se eludió.
- Reauditoría adversarial de `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`: no encontró bypass técnico material en lease, identidad, cutover ni parser de claims; el veto se limitó a que la claim y este handoff aún citaban `5cb3e1b` y 39/186, defecto de trazabilidad corregido aquí.

## Corte local v3

- Runner independiente: limpio en `codex/coordination-v3-runner-standby` sobre `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`; su rama `main` permanece en `e9e7818d33d850a904a9d0c758d3bd4f6b71cfaa`.
- Worktree CTA: limpio en `codex/coordination-v3-cta-standby` sobre el mismo SHA técnico; `codex/preserve-homepage-cta` permanece en `691ec57c0fe68a8ac6a900774d9d41cc4c02b45b` con sus dos blobs funcionales intactos.
- No existía automatización Codex, proceso autónomo ni lease activa que detener. No se creó commit, merge, push ni ref remota durante el corte.
- Preflight ejecutado desde principal, runner y CTA: sin fallos de clones, claims o coordinación; `scout=true`, `writer=false` y bloqueos esperados `active_writer_claim_limit` y `pending_local_diff_limit` por la candidata retenida en revisión.
- Auditoría operativa independiente: `PASS`, sin pérdida de trabajo, split-brain ni consumidor legacy conocido. El auditor observó un problema de firma nativa al iniciar Vitest con su Node 24; reprodujo 40/40 con Node 26 y confirmó que Node 24 cargaba el protocolo v3. La ejecución directora sí pasó 40/40 con Node `v24.14.0`.

## Decisiones

- El estado compartido vive en la raíz privada fija del usuario y se indexa por `origin` normalizado.
- Binding inmutable, registro reconciliado, leases legacy, versión por worktree, operaciones serializadas y tokens de un solo uso fallan cerrado.
- Toda claim no liberada bloquea un segundo writer; metadatos duplicados, desconocidos o sin rutas también bloquean.
- Las refs legacy se preservaron sin modificación y sus worktrees consumidores se movieron a ramas standby v3. No se permite despliegue mixto.

## Promoción manual

- El usuario autorizó mediante `Siguiente` el commit de estos metadatos, el push de la rama de gobernanza y una PR borrador hacia `main`; esta decisión no cambia `policy.json` ni concede autoridad autónoma.
- `origin/main` se verificó en `e9e7818d33d850a904a9d0c758d3bd4f6b71cfaa`, sin PR abierta ni rama remota homónima.
- CTA y los archivos no versionados `019f6d23` permanecen fuera del alcance. Cada SHA subido debe pasar el gate local y el SHA final exige `Quality gate` remoto verde.

## Pendiente

- Crear la PR borrador y registrar su URL y SHA final.
- Mantener la PR sin fusión hasta revisión humana y `Quality gate` remoto verde.
- Sin fusión, despliegue ni publicación.

- mensaje_enviado_a: tarea actual de Codex.
