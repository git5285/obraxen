# CTA de portada alineada con el gate de contacto

- thread_id: active-20260717-homepage-cta-main-5138804
- actualizado: 2026-07-17 19:14 Europe/Madrid
- estado: liberado
- objetivo: Entregar de forma manual y trazable la CTA aprobada mediante PR, sin desplegar ni publicar.
- archivos:
  - src/lib/homepage.ts
  - tests/homepage.test.tsx
  - automation/agents/policy.json
  - tests/agents/policy.test.ts
  - .coordination/claims/active-20260717-homepage-cta-main-5138804.md
  - .coordination/handoffs/active-20260717-homepage-cta-main-5138804.md
- cambios_ajenos_detectados: Sí; se preservaron sin cambios los dos archivos de coordinación no versionados de 019f6d23 y los worktrees ajenos.
- consumidores: tarea actual del usuario; revisión independiente de auditor.
- siguiente_paso: Ninguno; la PR #25 quedó fusionada con Quality verde y la publicación continúa bloqueada.

## Transferencia autorizada

- El usuario indicó `Hazlo` después de pedir que la mejora quedase visible en `/Users/danielgarcia/Projects/Obraxen`.
- La transferencia preservó exactamente los blobs funcionales por SHA-256.
- La rama local es `codex/improve-homepage-cta-5138804`; no existe commit ni acción remota.

## Revisión humana

- El 17 de julio de 2026 el usuario indicó proceder con el cierre controlado de la CTA.
- La prueba focal se repitió sobre el estado exacto visible: 24/24, con `git diff --check` correcto.
- La aceptación no amplió la autoridad remota ni de publicación del sistema autónomo.

## Promoción local limitada

- El usuario autorizó expresamente continuar con un commit local de esta CTA, manteniendo bloqueados push, PR, merge, despliegue y publicación.
- `automation/agents/policy.json` y `tests/agents/policy.test.ts` se reservan solo para habilitar y verificar temporalmente `allowCommit`; no deben formar parte del commit final.
- Los archivos ajenos `019f6d23...` quedan fuera del manifiesto y sus SHA-256 se preservan.
- El commit local final es `0a11f509197b86f08fb87fa675d1f7f56da5df44` y contiene únicamente los dos archivos funcionales.
- La política y su prueba se restauraron exactamente a `HEAD` con `allowCommit=false`; la claim queda liberada.

## Entrega remota autorizada

- El usuario autorizó expresamente ejecutar los pasos 1–5 sin detenerse, incluido push, PR y merge de esta CTA.
- La entrega remota queda limitada al commit `0a11f509197b86f08fb87fa675d1f7f56da5df44`; no autoriza despliegue ni publicación.
- La PR #25 superó `Quality gate` para el SHA exacto `0a11f509197b86f08fb87fa675d1f7f56da5df44` y se fusionó por squash en `0c9d559c6ac4bed51bf6573d03d5abfe314ddd62`.
- No se ejecutó ningún despliegue ni se alteró el gate de publicación.
