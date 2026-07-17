# Handoff: retirada reversible del borrador de proyectos

- thread_id: audit-security-20260717-0c9d559
- fecha: 2026-07-17 19:20 Europe/Madrid
- estado: completado
- base: 0c9d559c6ac4bed51bf6573d03d5abfe314ddd62

## Resultado

- `data/proyectos.borrador.json` se retira del arbol actual sin reescribir el historial.
- `.gitignore` bloquea su reintroduccion accidental.
- `REPOSITORY_EXPOSURE.md` distingue la retirada actual de la persistencia en commits y clones anteriores.
- El producto y el gate de activacion solo consumen `data/proyectos.json`.

## Verificacion

- `git diff --check`: correcto.
- 191 pruebas unitarias y build de 52 paginas: correctos.
- 2 E2E de contacto; 89 E2E correctas y 8 omisiones intencionadas.
- Lighthouse: tres rutas localizadas dentro de presupuesto.
- Activacion: `NO-GO` con 12 bloqueos; `publicationAuthorized=false`; `publishSwitch=false`.
- Auditor independiente: `PASS` sin defectos funcionales o de seguridad.
- Commit inicial del paquete: `5769159`.
- `Quality gate` remoto correcto para el SHA final `4153f5eb7bb4e3eff164f9b8d4714d625fb16d09` (run `29599860133`).
- PR #26 fusionada por squash en `5b546128e2b910733c68bc1a2fb9d46788faf11b`.

## Limite vigente

- No desplegar ni publicar.
