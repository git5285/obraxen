# Handoff: retirada reversible del borrador de proyectos

- thread_id: audit-security-20260717-0c9d559
- fecha: 2026-07-17 19:20 Europe/Madrid
- estado: pendiente_de_entrega_remota
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

## Pendiente

- Crear PR manual, verificar `Quality gate` remoto para el SHA exacto y fusionar solo con resultado verde.
- No desplegar ni publicar.
