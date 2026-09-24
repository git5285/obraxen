# Expediente de activación · Fase 6.7

Alcance: contrato interno conservado en `domain/publication/` tras retirar `src/`. Su resultado
no valida el contenido, build ni publicación de la Home en `apps/public-site/`.
Para Home consultar [HOMEPAGE.md](HOMEPAGE.md) y el apartado A del runbook.
La automatización puede comprobar evidencia, pero no conceder autorización.

Contrato vigente: 6 de septiembre de 2026.

Este expediente convierte la activación externa en una puerta reproducible. No
es asesoramiento jurídico, no sustituye revisiones profesionales y no autoriza
preview, despliegue, conexión web del dominio, indexación, formulario ni analítica.

## Puerta ejecutable

```bash
npm run check:activation
```

El comando deriva el resultado de `data/brand.json` y
`domain/publication/activation.mjs`; no lee el catálogo de proyectos. Un resultado sin bloqueos significa
únicamente `READY_FOR_PROTECTED_CANDIDATE`: todavía exige preview protegida del
SHA exacto, auditoría completa y decisión humana `GO/NO-GO`.

`ACTIVATION_INPUTS.md` conserva el inventario humano vigente de declaraciones,
documentos y revisiones. El gate bloquea exclusivamente por revisión legal de la
web y del tratamiento con Resend, y por revisión profesional de ES, EN, DE y FR.
Los demás faltantes permanecen como advertencias de negocio y no se convierten
en aprobaciones por dejar de bloquear.

La puerta global no autoriza casos individuales. Los contratos y evidencias
se conservan en `domain/publication/`; el renderizador `publicProjects`, sus
rutas y APIs se retiraron. Ningún dato interno se publica por superar este check.

El resultado actual no se copia en este documento. Debe consultarse con el
comando anterior: cualquier bloqueo produce `NO-GO`, y un resultado sin bloqueos
solo permite preparar una candidata protegida.

## Requisitos bloqueantes

### 1. Revisión legal y Resend

- aprobación de aviso legal, privacidad, cookies y consentimiento;
- aprobación del tratamiento de captación con Resend, incluido DPA,
  transferencias, subencargados, tracking, conservación, accesos y borrado.

### 2. Revisión lingüística

- revisor y fecha independientes para inglés, alemán, español y francés;
- correcciones entregadas por ruta o confirmación inequívoca de que la versión
  concreta revisada es la del SHA candidato.

## Advertencias no bloqueantes

Identidad, contacto, naming y evidencias de autorización de casos continúan en
las fuentes estructuradas y en `ACTIVATION_INPUTS.md`. Son responsabilidad del
propietario y deben mantenerse correctas, pero no forman parte del resultado
`NO-GO` por decisión expresa de gobernanza del 6 de septiembre de 2026.

### Casos y fotografías

Para cada uno de `delticom-hannover`, `tp-link-dusseldorf`,
`dadada-euskirchen`, `loreal-gauchy`, `blitz-bremen` y `hologram-paris` debe
elegirse una vía:

1. autorización documentada que cubra nombre del cliente y fotografías web,
   indicando entidad autorizante, fuente, fecha, referencia y revisión legal; o
2. anonimización/retirada completa del nombre, imágenes y cualquier elemento
   identificable que no disponga de cobertura.

Para completar la vía `autorizar`, cada caso puede aportar un
`documento_referenciado` que cubra el alcance publicado y una
`revision_legal_verificada` enlazada al mismo documento. Una declaración del
responsable no se convierte en ninguna de esas dos evidencias. Su ausencia se
informa como advertencia, no como bloqueo. El inventario vigente por caso se
mantiene en `ACTIVATION_INPUTS.md`.

## Diligencia histórica sobre Resend

Referencia histórica, no verificada de nuevo: la integración Resend se retiró.
Estos apuntes no describen servicios activos ni una comprobación remota actual.
La revisión documental pública no constituye aceptación contractual:

- el DPA de Plus Five Five, Inc. es un documento mutable, se incorpora al
  acuerdo al aceptar el servicio e incluye SCC para transferencias; debe
  archivarse la versión exacta que acepte la entidad contratante;
- Resend declara que su procesamiento principal y los datos de cuenta se alojan
  en Estados Unidos. Seleccionar envío desde Irlanda no cambia la residencia de
  metadatos, logs y registros API;
- el DPA declara borrado de datos de usuario dentro de 90 días tras terminar la
  cuenta y un aviso previo de 14 días para cambios de subencargados;
- la lista de subencargados puede cambiar. El DPA vigente prevé aviso previo para
  altas o sustituciones, pero la lista por sí sola no demuestra qué proveedores
  acceden al contenido de este formulario y ese alcance debe aclararse;
- la integración preparada transmite nombre, email, empresa y mensaje, sin
  adjuntos ni base propia. Deben fijarse conservación del buzón, accesos, borrado,
  respuesta a derechos, tracking desactivado y mecanismo de transferencias.

Documentos oficiales a archivar y aprobar en su versión aceptada:

- [Resend DPA](https://resend.com/legal/dpa)
- [Resend subprocessors](https://resend.com/legal/subprocessors)
- [Resend data residency](https://resend.com/docs/dashboard/domains/regions)
- [Resend GDPR](https://resend.com/security/gdpr)
- [Resend Terms of Service](https://resend.com/legal/terms-of-service)

La aprobación debe registrar persona autorizada, cuenta/entidad contratante,
versiones revisadas, decisión sobre transferencias y subencargados, configuración
de tracking, conservación y procedimiento de baja/borrado. Hasta entonces,
`formularioRevisionAprobada` permanece en `false`.

La activación técnica exige además una regla distribuida de limitación de
solicitudes para `/api/contact/`, configurada y probada en el proveedor de borde.
En Vercel Preview ya está publicada una regla `POST` por IP, con 100 solicitudes
por ventana fija de 60 segundos y respuesta `429`, y
`CONTACT_RATE_LIMIT_MODE=vercel-waf` está registrado en ese entorno. Sin ese
valor, la configuración del formulario permanece cerrada aunque el resto de
variables exista. El límite en memoria continúa como defensa secundaria, no como
garantía entre instancias. Esta precondición de entorno no forma parte del
recuento documental: la puerta de datos y la de entorno deben estar verdes de
forma independiente.

## Secuencia histórica de cierre del legado — no ejecutar

1. Recibir y verificar el expediente anterior.
2. Actualizar datos y textos mediante PR; ejecutar `npm run check:quality` y
   `npm run check:activation`.
3. Con cero bloqueos y autorización expresa, crear una preview protegida del SHA
   exacto, sin dominio web ni producción conectados.
4. Auditar idiomas, permisos, entrega del formulario real, límite externo de
   solicitudes y respuesta ante abuso, consentimiento, metadata, CSP,
   navegadores, móvil, accesibilidad, Lighthouse y exposición histórica.
5. Registrar responsable, URL, SHA, variables, rollback y decisión `GO`,
   `GO con condiciones` o `NO-GO`.
6. Publicar únicamente tras un `GO` expreso. Cualquier otro resultado mantiene
   todas las superficies apagadas.

## Preparación del rollback

Ante exposición sin control, identidad o permiso incorrectos, entrega defectuosa,
PII en logs o regresión crítica, preparar inmediatamente el rollback y conservar
evidencia mínima sin datos personales. Ejecutarlo solo con autorización humana
que identifique acción, entorno y alcance, o una autorización de incidente ya
aplicable. Sin ella, solicitar la decisión antes de modificar servicios.
El [apartado A del runbook](DEPLOYMENT_RUNBOOK.md#a-home-preparación-local-y-frontera-de-entrega)
identifica la entrega Home; el apartado histórico 5 conserva el procedimiento
del legado y sus condiciones de autorización, no funcionalidades de Home.

El bootstrap en `ERROR` registrado el 12 de septiembre de 2026 es histórico;
no acredita el estado remoto actual ni la ausencia de un deployment recuperable.
Verificar el deployment afectado y el destino de recuperación antes de actuar.
