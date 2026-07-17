# Claim: retirada reversible del borrador de proyectos

- thread_id: audit-security-20260717-0c9d559
- actualizado: 2026-07-17 19:20 Europe/Madrid
- estado: en_curso
- objetivo: Retirar el borrador de proyectos del arbol Git actual, impedir su reintroduccion accidental y documentar el limite del historial, sin reescribirlo ni publicar.
- archivos:
  - data/proyectos.borrador.json
  - .gitignore
  - REPOSITORY_EXPOSURE.md
  - automation/agents/policy.json
  - tests/agents/policy.test.ts
  - .coordination/claims/audit-security-20260717-0c9d559.md
  - .coordination/handoffs/audit-security-20260717-0c9d559.md
- cambios_ajenos_detectados: Se preservan sin modificacion los cuatro registros locales de coordinacion de `019f6d23...` y `active-20260717-homepage-cta...`; se integraran en un paquete posterior autorizado.
- consumidores: revision humana del usuario y auditor independiente.
- siguiente_paso: enviar la rama, abrir la PR y exigir Quality verde para el SHA exacto antes de fusionar.

## Limites

- No se reescribe el historial Git ni se eliminan clones o ramas.
- No se despliega ni se publica la web.
- `automation/agents/policy.json` y su prueba se reservaron como precaucion, pero no fue necesario modificarlos y no forman parte del cambio final.

## Verificacion local

- El sitio no referencia el borrador y compila 52 paginas sin el archivo.
- `npm run check:quality`: correcto; 191 unitarias, 2 E2E de contacto, 89 E2E correctas, 8 omisiones intencionadas, WebKit y Lighthouse dentro de presupuesto.
- Activacion: `NO-GO`, 12 bloqueos, publicacion no autorizada e interruptor apagado.
- Auditoria independiente: `PASS`; confirma retirada reversible, documentacion historica correcta y ausencia de secretos en el diff.
- Commit funcional y de trazabilidad creado: `5769159`.
