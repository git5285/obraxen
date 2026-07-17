# Claim: endurecer guardarrailes de agentes y CI

- thread_id: harden-agent-guardrails-20260717-3f5104b
- actualizado: 2026-07-17 19:56 Europe/Madrid
- estado: liberado
- objetivo: Reducir permisos locales de Claude, publicar instrucciones durables, proteger los presupuestos de calidad y fijar GitHub Actions a SHA verificados.
- archivos:
  - .claude/settings.json
  - .claude/settings.local.json
  - CLAUDE.md
  - automation/agents/policy.json
  - tests/agents/policy.test.ts
  - .github/workflows/quality.yml
  - .coordination/claims/close-local-coordination-20260717-5b54612.md
  - .coordination/handoffs/close-local-coordination-20260717-5b54612.md
  - .coordination/claims/harden-agent-guardrails-20260717-3f5104b.md
  - .coordination/handoffs/harden-agent-guardrails-20260717-3f5104b.md
- cambios_ajenos_detectados: Ninguno; main esta limpio y los registros locales previos ya quedaron integrados en la PR #27.
- consumidores: Claude Code local, agentes autonomos, GitHub Actions y tareas humanas del repositorio.
- siguiente_paso: Ninguno; la PR #28 se fusiono con Quality verde y la configuracion local quedo validada.

## Fuentes verificadas

- Claude Code local `2.1.207` admite el modo de permisos `manual`.
- `actions/checkout@v5`: `93cb6efe18208431cddfb8368fd83d5badbf9bfd`.
- `actions/setup-node@v5`: `a0853c24544627f65ddf259abe73b1d18a591444`.
- `actions/cache@v5`: `caa296126883cff596d87d8935842f9db880ef25`.
- `actions/upload-artifact@v6`: `b7c566a772e6b6bfb58ed0dc250532a479d7789f`.

## Limites

- Los dos archivos `.claude/` son configuracion local ignorada y no formaran parte del commit.
- No se amplian permisos autonomos, no se cambian dependencias y no se despliega ni publica.

## Cierre remoto

- SHA revisado: `0ce007f5c8de63a20ee85f59082c20b42f15a869`.
- `Quality gate` correcto: run `29601590641`.
- PR #28 fusionada por squash en `36d0e4293dd68fc26112e24496f8138f70444dd1`.
