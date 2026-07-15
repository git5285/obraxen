# Expediente de activación · Fase 6.7

Estado: **NO-GO verificable** · actualizado: 15 de julio de 2026.

Este expediente convierte la activación externa en una puerta reproducible. No
es asesoramiento jurídico, no sustituye revisiones profesionales y no autoriza
preview, despliegue, dominio, indexación, formulario ni analítica.

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
| Identidad, sociedad y contacto | 8 | Pendiente |
| Revisión legal y proveedor | 2 | Pendiente |
| Revisión profesional en/de/es/fr | 4 | Pendiente |
| Permisos de seis casos y fotografías | 24 | Pendiente |
| **Total** | **38** | **NO-GO** |

`publicar` continúa en `false`. No se ha creado ninguna candidata ni aceptado
ningún contrato en nombre de la futura sociedad.

## Expediente mínimo que debe recibirse

### 1. Identidad y contacto

- nombre comercial definitivo;
- sociedad constituida, razón social, CIF/NIF y domicilio validado;
- dominio definitivo;
- email público y buzón separado para derechos de privacidad;
- teléfono o WhatsApp publicable;
- persona con capacidad para aprobar proveedores y publicación.

### 2. Revisión legal y lingüística

- aprobación profesional de aviso legal, privacidad, cookies y consentimiento,
  con revisor, fecha y referencia del entregable;
- revisor y fecha independientes para inglés, alemán, español y francés;
- correcciones entregadas por ruta o confirmación inequívoca de que la versión
  concreta revisada es la del SHA candidato.

### 3. Casos y fotografías

Para cada uno de `delticom-hannover`, `tp-link-dusseldorf`,
`dadada-euskirchen`, `loreal-gauchy`, `blitz-bremen` y `hologram-paris` debe
elegirse una vía:

1. autorización documentada que cubra nombre del cliente y fotografías web,
   indicando entidad autorizante, fuente, fecha, referencia y revisión legal; o
2. anonimización/retirada completa del nombre, imágenes y cualquier elemento
   identificable que no disponga de cobertura.

Una confirmación interna o la posesión de fotografías no equivale a permiso de
publicación.

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

## Secuencia de cierre

1. Recibir y verificar el expediente anterior.
2. Actualizar datos y textos mediante PR; ejecutar `npm run check:quality` y
   `npm run check:activation`.
3. Con cero bloqueos y autorización expresa, crear una preview protegida del SHA
   exacto, sin dominio ni producción conectados.
4. Auditar idiomas, permisos, formulario real, consentimiento, metadata, CSP,
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
