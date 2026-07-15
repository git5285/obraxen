# Runbook de cutover y publicación

Estado: **bloqueado** · actualizado: 15 de julio de 2026.

Este documento prepara una activación futura; no autoriza preview, despliegue,
dominio, indexación, analítica ni formulario. Next.js ya es la única
implementación y no existe un segundo cutover técnico pendiente.

## 1. Condiciones de entrada

No se crea una URL candidata hasta que una PR demuestre simultáneamente:

- identidad comercial y sociedad constituidas, dominio y buzones reales;
- textos legales revisados y `legalRevisionAprobada: true`;
- en/de/es/fr con estado `aprobada`, revisor y fecha;
- Resend aprobado documentalmente, DPA archivado, subencargados, transferencias,
  conservación y buzón responsable revisados;
- seis casos documentados para nombre y fotografías, o anonimizados;
- `npm run check:quality`, auditoría de dependencias y revisión de exposición en
  verde;
- autorización expresa del usuario para crear una preview protegida.

`data/brand.json` es el control ejecutable. Si `publicar: true` convive con una
condición incompleta, el build debe fallar; no se corrige el gate para forzar la
salida.

## 2. Preview candidata protegida

1. Crear una rama/PR exclusiva de activación y reservar sus archivos.
2. Configurar el entorno Vercel `preview` con autenticación comprobada.
3. Incorporar secretos solo en Vercel/GitHub: IDs de proyecto, token, dominio de
   envío, `RESEND_API_KEY`, buzones y, si se aprueban, IDs analíticos.
4. Mantener producción y dominios desconectados.
5. Activar temporalmente `ENABLE_VERCEL_PREVIEWS=true` solo con autorización.
6. Dejar que el job `Gated Vercel preview` construya el SHA exacto tras el gate.
7. Registrar URL, SHA, expiración/acceso y responsable en el handoff.

No se comparte una URL hasta verificar que exige autenticación. `noindex` no se
considera un control de acceso.

## 3. Auditoría candidata

Sobre la URL exacta, comprobar en los cuatro idiomas:

- navegación, equivalentes de idioma, formularios, consentimiento y teclado;
- canonical, `hreflang`, `x-default`, Open Graph, robots, sitemap y JSON-LD;
- cero nombres temporales, datos ficticios, borradores o campos `sin dato`
  presentados como afirmación;
- permisos de cada fotografía/cliente y ausencia de metadatos sensibles;
- entrega real de una consulta de prueba, recepción, respuesta, borrado y ausencia
  de PII en logs/analítica;
- CSP, cabeceras, dependencias, Lighthouse, Axe, Chromium, WebKit y móvil real;
- páginas, aliases y deployments antiguos inaccesibles.

El resultado se registra como `GO`, `NO-GO` o `GO con condiciones`. Solo `GO`
firmado por la persona responsable permite solicitar la decisión de publicación.

## 4. Decisión formal de publicación

La decisión debe identificar SHA, URL candidata, dominio, fecha, responsable,
variables aprobadas y plan de rollback. Un merge a `main`, un CI verde o una
preview correcta no sustituyen esa autorización.

Tras autorización expresa:

1. conectar el dominio y verificar TLS/DNS;
2. activar producción desde el artefacto/commit auditado, sin reconstruir otro SHA;
3. validar redirecciones, canonical, sitemap, robots e indexación;
4. enviar sitemap a Search Console;
5. activar formulario y analítica solo si sus aprobaciones independientes están
   registradas;
6. ejecutar smoke inmediato y monitorizar logs sin PII.

## 5. Rollback

Se revierte inmediatamente ante exposición sin control, formulario con entrega
incorrecta, error legal/identitario, rutas críticas rotas, PII en logs o
regresión grave de seguridad/accesibilidad.

1. retirar alias/dominio del deployment defectuoso o promover el último
   deployment aprobado;
2. desactivar `CONTACT_FORM_ENABLED` e IDs analíticos si el incidente los afecta;
3. conservar evidencia técnica mínima sin datos personales;
4. verificar HTTP, aliases y DNS después del rollback;
5. abrir incidente y no reactivar hasta un nuevo `GO`.

## 6. Estado actual

**NO-GO.** Fases técnicas 6.1–6.6 completas; Fase 6.7 bloqueada por identidad,
sociedad, dominio, buzones, permisos, revisión legal/lingüística y aceptación del
proveedor. Vercel permanece sin deployments ni dominios y
`git.deploymentEnabled` continúa desactivado.
