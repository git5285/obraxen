# Handoff: restore agent control plane

- thread_id: codex-restore-agent-control-20260802
- fecha: 2026-08-02 13:57 Europe/Madrid
- estado: candidata_local_verificada
- base: `edb39bc5b736e4166aeba758fe46982db156bf9e`
- rama: `codex/restore-agent-control-20260802`

## Resultado

- Las autorizaciones agrupadas aceptan rutas literales de Next.js como
  `src/app/[lang]/page.tsx`.
- Los comodines `*`, `?` y `{...}` siguen rechazados.
- La documentacion separa el preflight local de la disponibilidad real del
  modelo y exige un `spawn_agent` con child id mas contrato valido para cerrar
  un fallo de disponibilidad.
- Los perfiles especializados conservan `gpt-5.6-sol`: el canario real
  `019fc252-9c9d-7e52-8e4e-59db6d2eb84e` arranco el scout y devolvio un
  schemaVersion 4 valido sobre la base actual.

## Verificacion

- El bundle exacto que fallo durante la entrega de la CTA ahora valida y
  conserva sus cuatro rutas ordenadas.
- `tests/agents/authorizations.test.ts`: 10 pruebas correctas.
- Suite focalizada del plano de control: 112 pruebas correctas.
- ESLint y TypeScript: correctos.
- Activacion antes/despues: salida identica, `NO-GO`, 24 bloqueos,
  publicacion no autorizada e interruptor apagado.
- `npm run check:quality`: correcto con 276 unitarias, build de 52 paginas,
  2 E2E de contacto, 89 E2E estandar correctas, 8 omisiones previstas,
  WebKit y Lighthouse dentro de presupuesto.
- La primera revision independiente detecto que permitir cualquier corchete
  mantenia semantica pathspec de Git. La correccion restringe la gramatica y
  exige `git --literal-pathspecs add --`; la segunda revision dio `PASS` sin
  findings restantes.

## Limites

- No se cambia modelo, politica, autoridad, activacion ni publicacion.
- No se despliega ni publica.
- Commit, push y PR requieren una decision humana posterior.
