# Handoff: endurecer guardarrailes de agentes y CI

- thread_id: harden-agent-guardrails-20260717-3f5104b
- fecha_inicio: 2026-07-17 19:45 Europe/Madrid
- fecha_cierre: 2026-07-17 19:56 Europe/Madrid
- estado: completado
- base: 3f5104b9f11a5deb24b6bc7d9d3d6a6d195acb3e

## Resultado

- Claude Code local usa `defaultMode: manual`; las mutaciones Git, red, dependencias y filesystem pasan a confirmacion.
- La regla local que leia `data/proyectos.borrador.json` fue retirada.
- `CLAUDE.md` hace durables las reglas de coordinacion, evidencia, gates y publicacion bloqueada.
- La politica protege `CLAUDE.md`, `scripts/lighthouse-budgets.ts` y `scripts/qa-port.d.mts`, con regresiones directas.
- Las seis referencias de GitHub Actions quedaron fijadas a los SHA oficiales de sus tags actuales.
- Se incorpora el cierre de la PR #27 sin modificar su historial funcional.

## Verificacion

- `jq empty` para ambos ajustes de Claude: correcto.
- `claude doctor` con Claude Code 2.1.207: sin problemas de instalacion.
- Politica valida; 32/32 pruebas focales de policy y Lighthouse correctas.
- No quedan referencias `uses: ...@vN` mutables en el workflow.
- `git diff --check`: correcto.
- `npm run check:quality`: 194 unitarias, build de 52 paginas, 2 E2E de contacto, 89 E2E correctas, 8 omisiones intencionadas, WebKit y Lighthouse dentro de presupuesto.
- Activacion sin cambios: `NO-GO`, 12 bloqueos, publicacion no autorizada e interruptor apagado.
- Auditoria independiente: `PASS` tras corregir la cronologia heredada de la PR #27.
- `Quality gate` remoto correcto para `0ce007f5c8de63a20ee85f59082c20b42f15a869` (run `29601590641`).
- PR #28 fusionada por squash en `36d0e4293dd68fc26112e24496f8138f70444dd1`.

## Limite vigente

- No desplegar ni publicar.
