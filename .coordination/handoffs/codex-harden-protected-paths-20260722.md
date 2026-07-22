# Handoff: endurecimiento manual de rutas protegidas

- thread_id: codex-harden-protected-paths-20260722
- fecha: 2026-07-22 15:53 Europe/Madrid
- estado: candidata_local_verificada
- base: `df755c196659a7528ed3ff346acf493bc9e2c4f0`
- rama: `codex/harden-protected-paths-20260722`

## Resultado

- `automation/agents/policy.json` incorpora once rutas criticas que el builder
  autonomo no debe modificar: configuracion de Git, runtime, lint, TypeScript,
  Vitest, esquemas de datos y documentos de gobernanza.
- Se elimina `data/proyectos.borrador.json` de `protectedPaths` porque la PR `#26`
  retiro ese archivo del arbol actual.
- `tests/agents/policy.test.ts` prueba las nuevas protecciones y la ausencia de la
  ruta obsoleta.
- `COORDINATION.md` queda reconciliado hasta la PR `#33` y explica que los
  marcadores inmutables viven en worktrees registrados mientras las transiciones
  posteriores se conservan en el log operativo compartido.
- No se modifica producto, dependencias, activacion, configuracion de Vercel,
  despliegue ni publicacion.

## Gobernanza

- La politica protege deliberadamente sus propios archivos y `COORDINATION.md`;
  por ello esta es una entrega manual dirigida por la decision humana
  `user-approved-audit-remediation-order-20260722`, no un diff autonomo.
- La claim exacta `codex-harden-protected-paths-20260722` y su lease exclusiva
  cubren los cuatro archivos de candidata y el marcador del worktree de control.
- Commit, push y PR borrador se limitan a una autorizacion agrupada estrecha;
  merge, despliegue, publicacion, borrado y renombrado de Vercel quedan fuera.

## Verificacion local

- Runtime gobernado: Node `24.18.0`, npm `11.16.0`, fingerprint
  `f5a39a4508402e462ff83bbe6d4b4faf727f0478621e44f19210ea412995aad5`.
- `git diff --check`: correcto.
- Prueba focalizada: `tests/agents/policy.test.ts`, 55 tests correctos.
- Activacion base/candidata: salida identica, SHA-256
  `6e1f82b3ce68ddc43a5bf4e73ab25e06deea59d0e512d4bca62d9436e0130d63`,
  `NO-GO`, 24 bloqueos y publicacion no autorizada.
- `npm run check:quality`: correcto; 272 unitarias, build de 52 paginas, 2 E2E
  de contacto, 89 E2E estandar correctas, 8 omisiones previstas y smoke WebKit
  correcto.
- Lighthouse: `/en/`, `/de/projekte/` y `/fr/projets/blitz-bremen/` dentro de
  presupuesto.

## Pendiente

- Crear commit, subir la rama y abrir PR borrador bajo la autorizacion agrupada.
- Esperar el `Quality gate` remoto del SHA exacto antes de solicitar fusion.
- No desplegar, publicar ni renombrar el proyecto Vercel.
