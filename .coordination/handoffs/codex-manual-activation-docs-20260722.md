# Handoff: entrega manual de documentacion de activacion protegida

- thread_id: codex-manual-activation-docs-20260722
- fecha: 2026-07-22 15:27 Europe/Madrid
- estado: candidata_local_verificada
- base: `81092a3db19b75506c5727628536e57be31c8770`
- rama: `codex/reconcile-activation-docs-20260722`

## Resultado

- Se integran sin cambios adicionales los cierres locales de la claim y el handoff `refresh-operational-docs-20260717-36d0e42`.
- `ACTIVATION_INPUTS.md`, `LEGAL_CHECKLIST.md`, `DEPLOYMENT_RUNBOOK.md`, `ROADMAP.md` y `README.md` dejan de copiar el antiguo total de 12 incidencias como estado actual.
- La declaracion del responsable queda separada del documento verificable y de la revision legal; no se atribuye al repositorio evidencia que no contiene.
- `npm run check:activation` queda como fuente canonica del estado, recuento y detalle.
- No se modifica producto, `data/`, configuracion de Vercel, despliegue ni publicacion.

## Gobernanza

- El intento `codex-reconcile-activation-docs-v2-20260722` fue vetado y liberado sin commit porque el ciclo autonomo no puede editar rutas protegidas.
- El auditor verifico que el contenido documental era correcto y que no ampliaba autorizaciones; su veto se limito al canal autonomo, sus artefactos y el conflicto de claims del worktree de control.
- Esta entrega adopta el mismo diff bajo la decision humana `user-approved-audit-remediation-order-20260722` y la claim manual exacta `codex-manual-activation-docs-20260722`.
- Commit, push y PR borrador se registran mediante una autorizacion agrupada estrecha; merge, despliegue, publicacion y renombrado de Vercel quedan fuera.

## Preservacion

- Claim historica transferida, SHA-256: `855de3591bf7d1d7c9974a3147e86cd231ed37036dacb1d2ecd3a9e5f0ca1c09`.
- Handoff historico transferido, SHA-256: `d4411ba496c484d16f142dbaa1d69fe30887bdc9f92be831cb48b8a207f0fc3c`.
- Los mismos dos archivos del worktree principal permanecen intactos con esos hashes.

## Verificacion local

- Runtime gobernado: Node `24.18.0`, npm `11.16.0`, fingerprint `f5a39a4508402e462ff83bbe6d4b4faf727f0478621e44f19210ea412995aad5`.
- `git diff --check`: correcto.
- `npm run check:diff`: correcto para la base revisada y el worktree completo.
- `npm run check:activation -- --json`: salida esperada `NO-GO`, `blockerCount: 24`, publicacion no autorizada e interruptor apagado; informe antes/despues identico.
- `npm run check:quality`: correcto; 260 unitarias, build de 52 paginas, 2 E2E de contacto, 89 E2E estandar correctas, 8 omisiones previstas y smoke WebKit correcto.
- Lighthouse: `/en/`, `/de/projekte/` y `/fr/projets/blitz-bremen/` dentro de los presupuestos de rendimiento, accesibilidad, buenas practicas, SEO, LCP, TBT y CLS.

## Pendiente

- Crear commit, subir la rama y abrir PR borrador bajo la autorizacion agrupada exacta.
- Esperar el `Quality gate` remoto del SHA exacto antes de solicitar fusion.
- No desplegar, publicar ni renombrar el proyecto Vercel.
