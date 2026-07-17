# Claim: coordinación compartida entre clones

- thread_id: `019f6d4b-baa0-7a82-90ad-f8c4a6b3c490`
- actualizado: `2026-07-17 12:15 CEST`
- estado: esperando_revision
- objetivo: endurecer el control de escritor único para que leases, clones independientes y todas las claims no liberadas se coordinen de forma fail-closed.
- rama: `codex/governance-shared-coordination`
- base: `1d31657504002e65e950b42f25e6e51e6f3dd326`

- archivos:
  - automation/agents/lease.mjs
  - automation/agents/lease.d.mts
  - automation/agents/preflight.mjs
  - automation/agents/preflight.d.mts
  - tests/agents/lease.test.ts
  - tests/agents/preflight.test.ts
  - automation/agents/README.md
  - .coordination/README.md
  - .coordination/claims/019f6d4b-baa0-7a82-90ad-f8c4a6b3c490-governance.md
  - .coordination/handoffs/019f6d4b-baa0-7a82-90ad-f8c4a6b3c490-governance.md

## Cambios ajenos preservados

- `.coordination/claims/019f6d23-b4ea-7843-ae83-f903a9fba614.md`: sin tocar; hash inicial `202278f3cc5b42130f956bc3882575567e0648a6db82867f2c30d05b6f60449a`.
- `.coordination/handoffs/019f6d23-b4ea-7843-ae83-f903a9fba614.md`: sin tocar; hash inicial `bdaaaedae8d69a8f826c3577bce749d4581740463edf25906525dcf7bfeef45c`.
- La automatización `obraxen-continuous-improvement` no existe actualmente en Codex; esta tarea no crea ni reactiva ninguna automatización.

## Límites

- Sin push, PR, fusión, despliegue ni publicación.
- Sin limpiar worktrees, claims o handoffs ajenos.
- Sin cambiar los bypasses del hook `pre-push`; quedan fuera de esta iteración.

## Hitos

- [x] Política, protocolo, preflight, lease y pruebas existentes revisados.
- [x] Estado compartido y registro de clones implementados.
- [x] Claims no liberadas tratadas como exclusivas.
- [x] Regresiones focalizadas y gate completo ejecutados con Node 24.
- [x] Dos rondas de veto técnico recibidas y sus hallazgos corregidos.
- [x] Reauditoría de `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f` sin bypass técnico material; su único veto fue actualizar la evidencia durable anterior, corregida en este registro.
- [x] Candidato técnico congelado en `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.
- [x] Handoff registrado; claim retenida en espera de revisión y corte legacy.

## Resultado

- Commits técnicos locales: `f4be03b17deeb33dbd4be29cbc9cf7a80bf8a573`, `5cb3e1b4080131073ee92e5673f17af472b45879` y `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f`.
- `Node v24.14.0`: 40/40 regresiones focalizadas; `npm run check:quality` pasó sobre `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f` con 187 unitarias, build, 2 E2E de contacto, 89 E2E estándar, 8 omisiones previstas y Lighthouse dentro de presupuesto.
- npm 12 avisó que admite Node `^24.15.0`; el proyecto declara `24.x` y todas las comprobaciones finalizaron correctamente con `v24.14.0`.
- Activación base `e9e7818` y candidata: `NO-GO`, 36 bloqueos, publicación no autorizada.
- El preflight v3 descubre los dos clones y bloquea runner + CTA por protocolo legacy. La adquisición compartida se rechaza antes de crear `owner`; no existe lease activa.
- La política autónoma veta correctamente este cambio manual por `maxDiffLines` y superficies protegidas. Requiere revisión humana; no se cambió la política.
- Sin push, PR, fusión, despliegue ni publicación.

## Pendiente humano

- Revisar el SHA técnico `5cbd3cd33ebc26726085fb4dd2a8181e6b95f71f` y este registro de coordinación.
- Decidir el corte secuencial para actualizar o retirar `.vercel/autonomous-runner` y `/private/tmp/obraxen-active-20260717-cta-e9e7818`; hasta entonces ningún writer v2 puede adquirir lease.
