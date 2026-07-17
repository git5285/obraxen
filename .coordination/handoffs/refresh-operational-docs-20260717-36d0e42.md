# Handoff: actualizar documentacion operativa

- thread_id: refresh-operational-docs-20260717-36d0e42
- fecha_inicio: 2026-07-17 19:57 Europe/Madrid
- estado: pendiente_de_entrega_remota
- base: 36d0e4293dd68fc26112e24496f8138f70444dd1

## Resultado

- `COORDINATION.md` usa claims/preflight como fuente dinamica, registra las PR #24-#28 y elimina el paso ya completado de migracion a Obraxen.
- `DEPLOYMENT_RUNBOOK.md` refleja 12 bloqueos actuales y los permisos de seis casos ya documentados.
- `TECHNICAL_AUDIT.md` refleja 194 unitarias, 52 paginas, 2 E2E de contacto, 89 E2E estandar correctas, 8 omisiones y los ultimos resultados Lighthouse.
- ADR-009 aclara que `git5285/remainon-web` era el nombre historico y que el repositorio vigente es `git5285/obraxen`.
- Las cifras historicas de entregas anteriores se conservan sin reinterpretarlas.
- Se incorpora el cierre de la PR #28 con cronologia explicita.

## Verificacion

- `git diff --check`: correcto.
- Las afirmaciones actuales obsoletas de 35 bloqueos, 100 unitarias y repositorio vigente RemainOn ya no permanecen en estos documentos.
- `npm run check:quality`: correcto con 194 unitarias, 52 paginas, 2 E2E de contacto, 89 E2E correctas, 8 omisiones intencionadas, WebKit y Lighthouse dentro de presupuesto.
- Activacion: `NO-GO`, 12 bloqueos, publicacion no autorizada e interruptor apagado.
- Auditoria independiente: `PASS` sin hallazgos.

## Pendiente

- Ejecutar gate completo, auditoria independiente y `Quality gate` remoto del SHA exacto.
- No desplegar ni publicar.
