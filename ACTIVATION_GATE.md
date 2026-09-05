# Expediente de activación · Fase 6.7

Estado: **NO-GO verificable** · actualizado: 18 de julio de 2026.

Este expediente convierte la activación externa en una puerta reproducible. No
es asesoramiento jurídico, no sustituye revisiones profesionales y no autoriza
preview, despliegue, conexión web del dominio, indexación, formulario ni analítica.

## Puerta ejecutable

```bash
npm run check:activation
```

El comando deriva el resultado de `data/brand.json`, `data/proyectos.json` y la
misma función que bloquea la publicación. Un resultado sin bloqueos significa
únicamente `READY_FOR_PROTECTED_CANDIDATE`: todavía exige preview protegida del
SHA exacto, auditoría completa y decisión humana `GO/NO-GO`.

Resultado actual:

| Bloque | Incidencias | Estado |
|---|---:|---|
| Nombre, identidad, sociedad y contacto | 1 | Pendiente |
| Revisión legal y proveedor | 2 | Pendiente |
| Revisión profesional en/de/es/fr | 4 | Pendiente |
| Permisos de seis casos y fotografías | 12 | Pendiente |
| **Total** | **19** | **NO-GO** |

`publicar` continúa en `false`. No se ha creado ninguna candidata ni aceptado
ningún contrato en nombre de la futura sociedad.

Entrada incorporada el 17 de julio de 2026: el responsable declaró de forma
expresa que los seis trabajos fueron ejecutados y que existe autorización legal
total para publicar el nombre del cliente y las fotografías web. La declaración
queda registrada mediante referencias internas `AUTH-RESP-20260717-*`; los
presupuestos y originales permanecen fuera del repositorio y no se incorporan
datos personales. Esa entrada acredita únicamente que la declaración se hizo:
no es un documento de autorización ni una revisión legal profesional.

Entrada incorporada el 16 de julio de 2026: `obraxen.com` consta registrado desde
el 15 de julio de 2026 y bajo control operativo en Cloudflare. El DNS autoritativo
publica los MX y SPF de Google Workspace, una clave DKIM de 2048 bits y DMARC en
modo de observación (`p=none`) con informes a `dmarc@obraxen.com`. Google Workspace
confirma DKIM activo para `obraxen.com`; `info@obraxen.com` existe como cuenta y
`privacy@obraxen.com` y `dmarc@obraxen.com` como alias sin licencia adicional.
No se ha conectado ningún registro A, AAAA o CNAME a la web, ni se ha probado en
esta fase una entrega externa de extremo a extremo. La sociedad aún no está
constituida; razón social `OBRAXEN SURFACE S.L.`, CIF/NIF `B93963841`, domicilio
Calle Federico García Lorca 22 y teléfono temporal `+34 653 916 970` quedan
declarados. Estos datos no sustituyen las revisiones de naming, legales,
lingüísticas ni los permisos de casos que mantienen la puerta en `NO-GO`.

## Expediente mínimo que debe recibirse

### 1. Nombre, identidad y contacto

- nombre comercial seleccionado: **resuelto con `Obraxen`**;
- búsqueda profesional registral y marcaria: **pendiente**; la comprobación
  preliminar de `NAMING_CLEARANCE.md` encontró usos exactos en construcción e
  ingeniería y no permite tratar el nombre como despejado;
- sociedad constituida, razón social `OBRAXEN SURFACE S.L.`, CIF/NIF `B93963841`
  y domicilio Calle Federico García Lorca 22 declarados;
- dominio definitivo: **resuelto con `obraxen.com`**;
- email público y buzón separado para derechos de privacidad: **resueltos con
  `info@obraxen.com` y `privacy@obraxen.com`**;
- teléfono temporal `+34 653 916 970` declarado;
- persona con capacidad para aprobar la publicación de los seis casos:
  **declaración recibida, acreditación documental pendiente**; la aprobación de
  proveedor y del resto de superficies públicas continúa pendiente donde
  corresponda.

### 2. Revisión legal y lingüística

- aprobación profesional de aviso legal, privacidad, cookies y consentimiento,
  con revisor, fecha y referencia del entregable;
- revisor y fecha independientes para inglés, alemán, español y francés;
- correcciones entregadas por ruta o confirmación inequívoca de que la versión
  concreta revisada es la del SHA candidato.

### 3. Casos y fotografías

Para cada uno de `delticom-hannover`, `tp-link-dusseldorf`,
`dadada-euskirchen`, `loreal-gauchy`, `blitz-bremen` y `hologram-paris` debía
elegirse una vía:

1. autorización documentada que cubra nombre del cliente y fotografías web,
   indicando entidad autorizante, fuente, fecha, referencia y revisión legal; o
2. anonimización/retirada completa del nombre, imágenes y cualquier elemento
   identificable que no disponga de cobertura.

Los seis casos conservan la declaración expresa del responsable del 17 de julio
de 2026 como `declaracion_responsable`, con alcance para nombre y fotografías,
fecha y referencia interna. Para completar la vía `autorizar` falta, en cada
caso, un `documento_referenciado` que cubra ese alcance y una
`revision_legal_verificada` enlazada al documento. La identidad y los originales
se conservan fuera del repositorio; no existe autorización de preview,
despliegue o publicación.

## Diligencia pública sobre Resend

La revisión documental pública no constituye aceptación contractual:

- el DPA de Plus Five Five, Inc. figura actualizado el 31 de diciembre de 2025,
  se incorpora al acuerdo al aceptar el servicio e incluye SCC para transferencias;
- Resend declara que su procesamiento principal y los datos de cuenta se alojan
  en Estados Unidos. Seleccionar envío desde Irlanda no cambia la residencia de
  metadatos, logs y registros API;
- el DPA declara borrado de datos de usuario dentro de 90 días tras terminar la
  cuenta y un aviso previo de 14 días para cambios de subencargados;
- la lista de subencargados, actualizada el 15 de julio de 2026, contiene 22
  entidades en Estados Unidos, incluidas infraestructura, analítica y proveedores
  de inteligencia artificial. La lista por sí sola no demuestra qué proveedores
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
Solo después se puede fijar `CONTACT_RATE_LIMIT_MODE=vercel-waf`. Sin ese valor,
la configuración del formulario permanece cerrada aunque el resto de variables
exista. El límite en memoria continúa como defensa secundaria, no como garantía
entre instancias. Esta precondición de entorno no se suma a las 24 incidencias de
datos del expediente: ambas puertas deben estar verdes de forma independiente.

## Secuencia de cierre

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

## Rollback preacordado

Se retira inmediatamente alias/dominio o se desactiva formulario/analítica ante
exposición sin control, identidad o permiso incorrectos, entrega de correo
defectuosa, PII en logs o regresión crítica. No existe todavía ningún deployment
que deba revertirse.
