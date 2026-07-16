# Runbook de cutover y publicación

Estado: **bloqueado** · actualizado: 16 de julio de 2026.

Este documento prepara una activación futura; no autoriza preview, despliegue,
dominio, indexación, analítica ni formulario. Next.js ya es la única
implementación y no existe un segundo cutover técnico pendiente.

## 1. Condiciones de entrada

No se crea una URL candidata hasta que una PR demuestre simultáneamente:

- identidad comercial y sociedad constituidas; dominio y buzones reales ya
  acreditados en la fase 6.7.2;
- textos legales revisados y `legalRevisionAprobada: true`;
- en/de/es/fr con estado `aprobada`, revisor y fecha;
- Resend aprobado documentalmente, DPA archivado, subencargados, transferencias,
  conservación y buzón responsable revisados;
- regla externa de limitación de solicitudes para `/api/contact/` configurada y
  probada; el límite en memoria no sustituye este control distribuido;
- seis casos documentados para nombre y fotografías, o anonimizados;
- `npm run check:quality`, auditoría de dependencias y revisión de exposición en
  verde;
- autorización expresa del usuario para crear una preview protegida.

La comprobación previa es ejecutable:

```bash
npm run check:activation
```

Debe devolver `READY_FOR_PROTECTED_CANDIDATE`. El estado actual devuelve
`NO-GO` con 35 incidencias verificables; el detalle y el contrato de entrada
están en `ACTIVATION_GATE.md`. Ese comando no sustituye la auditoría de la URL ni
la decisión humana de publicación.

`data/brand.json` es el control ejecutable. Si `publicar: true` convive con una
condición incompleta, el build debe fallar; no se corrige el gate para forzar la
salida.

## 2. Preview candidata protegida

1. Crear una rama/PR exclusiva de activación y reservar sus archivos.
2. Configurar el entorno Vercel `preview` con autenticación comprobada.
3. Incorporar secretos solo en Vercel/GitHub: IDs de proyecto, token, dominio de
   envío, `RESEND_API_KEY`, buzones y, si se aprueban, IDs analíticos. Registrar
   `CONTACT_RATE_LIMIT_MODE=vercel-waf` solo después de acreditar la regla externa.
4. Generar un build nuevo después de fijar esas variables. Las páginas se
   prerenderizan: cambiar una variable en Vercel no modifica un artefacto ya
   construido ni una URL candidata existente.
5. Mantener producción y dominios desconectados.
6. Activar temporalmente `ENABLE_VERCEL_PREVIEWS=true` solo con autorización.
7. Dejar que el job `Gated Vercel preview` construya el SHA exacto tras el gate.
8. Registrar URL, SHA, conjunto/versionado de variables, expiración/acceso y
   responsable en el handoff.

No se comparte una URL hasta verificar que exige autenticación. `noindex` no se
considera un control de acceso. Cualquier cambio posterior de variable que afecte
identidad, dominio, metadata, formulario, consentimiento o analítica invalida la
auditoría candidata: exige rebuild/redeploy del mismo SHA y repetir el apartado 3.

## 3. Auditoría candidata

Sobre la URL exacta, comprobar en los cuatro idiomas:

- navegación, equivalentes de idioma, formularios, consentimiento y teclado;
- canonical, `hreflang`, `x-default`, Open Graph, robots, sitemap y JSON-LD;
- cero nombres temporales, datos ficticios, borradores o campos `sin dato`
  presentados como afirmación;
- permisos de cada fotografía/cliente y ausencia de metadatos sensibles;
- entrega real de una consulta de prueba, recepción, respuesta, borrado y ausencia
  de PII en logs/analítica;
- rechazo o ralentización verificable de abuso en `/api/contact/` desde más de
  una instancia, sin bloquear el flujo legítimo ni registrar el contenido;
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
   registradas y la limitación externa del formulario está verificada;
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

**NO-GO.** Fases técnicas 6.1–6.6 y puerta ejecutable 6.7.0 completas. Fase 6.7
registra 35 incidencias externas de identidad y sociedad, teléfono, permisos,
revisión legal/lingüística y aceptación del proveedor. Vercel permanece
sin deployments ni dominios y `git.deploymentEnabled` continúa desactivado.
