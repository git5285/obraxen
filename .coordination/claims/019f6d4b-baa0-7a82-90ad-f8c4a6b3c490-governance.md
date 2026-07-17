# Claim: coordinación compartida entre clones

- thread_id: `019f6d4b-baa0-7a82-90ad-f8c4a6b3c490`
- actualizado: `2026-07-17 14:45 CEST`
- estado: liberado
- objetivo: cerrar la coordinación v3 ya fusionada, liberar su reserva y registrar el resultado remoto sin desplegar ni publicar.
- rama: `codex/release-governance-claim`
- base: `dd8566d92c4fa0f76b3af0a6f036fdc094c88762`

- archivos:
  - .coordination/claims/019f6d4b-baa0-7a82-90ad-f8c4a6b3c490-governance.md
  - .coordination/handoffs/019f6d4b-baa0-7a82-90ad-f8c4a6b3c490-governance.md

## Cierre post-merge autorizado

- El usuario indicó `Siguiente` después de identificar como próximo paso una rama mínima para liberar esta claim y registrar la fusión.
- Alcance exclusivo: estos dos metadatos propios y un commit local. Sin push, PR, despliegue ni publicación.
- PR `#22` fusionada por squash en `dd8566d92c4fa0f76b3af0a6f036fdc094c88762`; `Quality gate` de `main` verde y preview Vercel omitida.

## Cambios ajenos preservados

- `.coordination/claims/019f6d23-b4ea-7843-ae83-f903a9fba614.md`: sin tocar; hash inicial `202278f3cc5b42130f956bc3882575567e0648a6db82867f2c30d05b6f60449a`.
- `.coordination/handoffs/019f6d23-b4ea-7843-ae83-f903a9fba614.md`: sin tocar; hash inicial `bdaaaedae8d69a8f826c3577bce749d4581740463edf25906525dcf7bfeef45c`.
- La automatización `obraxen-continuous-improvement` no existe actualmente en Codex; esta tarea no crea ni reactiva ninguna automatización.

## Límites

- Autorizado manualmente en este cierre: actualizar estos dos metadatos propios y crear un commit local en `codex/release-governance-claim`.
- La promoción, paso a revisión y fusión squash de la PR `#22` se ejecutaron mediante decisiones humanas separadas; no ampliaron `policy.json`.
- Sin push ni PR de este cierre, despliegue o publicación en esta fase.
- Sin limpiar worktrees, claims o handoffs ajenos.
- Sin cambiar los bypasses del hook `pre-push`; quedan fuera de esta iteración.

## Corte v3 autorizado

- El usuario indicó `Siguiente` tras recibir como siguiente paso el corte secuencial de runner y CTA; se interpreta como autorización exclusiva para el corte local y reversible, sin push, PR, fusión, despliegue ni publicación.
- SHA técnico auditado para ambos consumidores: `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.
- Runner: crear `codex/coordination-v3-runner-standby` sin mover ni reescribir `main`.
- CTA: crear `codex/coordination-v3-cta-standby` sin mover ni reescribir `codex/preserve-homepage-cta`.
- Inventario previo: lease compartida ausente, ningún proceso autónomo activo, ninguna automatización Codex instalada y todas las claims del worktree CTA liberadas.

## Promoción manual autorizada

- El usuario indicó `Siguiente` después de que se identificara como próxima decisión promover la candidata mediante el flujo remoto obligatorio. Autoriza commit, push y PR borrador, sin ampliar la autoridad autónoma de `policy.json`.
- `origin/main` permanece en `e9e7818d33d850a904a9d0c758d3bd4f6b71cfaa`; no hay PR abierta ni rama remota `codex/governance-shared-coordination` al iniciar la promoción.
- Alcance remoto: los 14 paths trackeados de preflight, coordinación v3 y sus handoffs. La candidata CTA y los dos archivos no versionados `019f6d23` quedan excluidos.
- `npm run check:quality` y `npm run check:diff` deben pasar sobre cada SHA que se suba; el `Quality gate` remoto del SHA final debe quedar verde antes de cualquier decisión de fusión.

## Hitos

- [x] Política, protocolo, preflight, lease y pruebas existentes revisados.
- [x] Estado compartido y registro de clones implementados.
- [x] Claims no liberadas tratadas como exclusivas.
- [x] Regresiones focalizadas y gate completo ejecutados con Node 24.
- [x] Dos rondas de veto técnico recibidas y sus hallazgos corregidos.
- [x] Reauditoría de `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f` sin bypass técnico material; su único veto fue actualizar la evidencia durable anterior, corregida en este registro.
- [x] Candidato técnico congelado en `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.
- [x] Handoff registrado; claim retenida en espera de revisión y corte legacy.
- [x] Corte v3 inventariado y autorizado dentro de límites locales.
- [x] Runner migrado a una rama standby v3 con `main` preservada.
- [x] Worktree CTA migrado a una rama standby v3 con la candidata preservada.
- [x] Preflight posterior sin consumidores incompatibles y auditoría de cierre completada.
- [x] Promoción manual limitada autorizada y remoto reconciliado.
- [x] Metadatos de promoción comprometidos y rama subida.
- [x] PR borrador creada y handoff remoto registrado.
- [x] `Quality gate` remoto del SHA final verificado.
- [x] PR `#22` promovida a revisión y fusionada por squash tras autorización humana.
- [x] `Quality gate` posterior de `main` verde y preview Vercel omitida.
- [x] Cierre post-merge registrado y reserva liberada.

## Resultado

- Commits técnicos locales: `f4be03b17deeb33dbd4be29cbc9cf7a80bf8a573`, `5cb3e1b4080131073ee92e5673f17af472b45879` y `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.
- `Node v24.14.0`: 40/40 regresiones focalizadas; `npm run check:quality` pasó sobre `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f` con 187 unitarias, build, 2 E2E de contacto, 89 E2E estándar, 8 omisiones previstas y Lighthouse dentro de presupuesto.
- npm 12 avisó que admite Node `^24.15.0`; el proyecto declara `24.x` y todas las comprobaciones finalizaron correctamente con `v24.14.0`.
- Activación base `e9e7818` y candidata: `NO-GO`, 36 bloqueos, publicación no autorizada.
- Antes del corte, el preflight v3 descubrió los dos clones y bloqueó runner + CTA por protocolo legacy; la adquisición compartida se rechazaba antes de crear `owner` y no existía lease activa.
- La política autónoma veta correctamente este cambio manual por `maxDiffLines` y superficies protegidas. Requiere revisión humana; no se cambió la política.
- Corte completado: runner y CTA están limpios en ramas standby sobre `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`; `main` conserva `e9e7818d33d850a904a9d0c758d3bd4f6b71cfaa` y `codex/preserve-homepage-cta` conserva `691ec57c0fe68a8ac6a900774d9d41cc4c02b45b`.
- Preflight desde los tres consumidores: `cloneFailures=[]`, `claimFailures=[]`, `coordinationFailures=[]`, `scout=true` y `writer=false`; los bloqueos esperados son `active_writer_claim_limit` y `pending_local_diff_limit` por esta candidata retenida en revisión. Lease compartida ausente y `legacyLeases=[]`.
- Auditoría operativa independiente: `PASS`; no encontró split-brain, consumidor legacy conocido, pérdida de refs ni acción remota. Su entorno no pudo iniciar Vitest con el Node 24 firmado de Codex, pero cargó el protocolo v3 con ese runtime y reprodujo 40/40 con Node 26; la ejecución directora pasó 40/40 con Node `v24.14.0`.
- El corte local no realizó push, PR, fusión, despliegue ni publicación; la promoción manual posterior queda acotada por la autorización anterior.
- Promoción manual: commit `136ab2c75876501ba0bb595e0ac72a3e4b18fa3d` subido y PR borrador [#22](https://github.com/git5285/obraxen/pull/22) abierta hacia `main`; el primer `Quality gate` se inició sobre ese SHA.
- SHA final revisado de la PR: `22c706a9b0f842910d9440f62bb7122a107b635a`; `Quality gate` remoto verde.
- Integración squash: `dd8566d92c4fa0f76b3af0a6f036fdc094c88762`, autor `git5285`, un único padre `e9e7818d33d850a904a9d0c758d3bd4f6b71cfaa`.
- Workflow posterior de `main` `29580746090`: `Quality gate` verde; `Gated Vercel preview` omitida. Publicación permanece `NO-GO` con 36 bloqueos.

## Pendiente humano

- Decidir por separado si se sube `codex/release-governance-claim` y se abre una PR mínima para incorporar este cierre a `main`.
- Despliegue y publicación continúan sin autorización.
