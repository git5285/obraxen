# Entradas pendientes para activar Obraxen

Alcance: inventario interno heredado del legado retirado, fechado abajo.
El contrato ejecutable permanece en `domain/publication/`. Las afirmaciones sobre
proveedores y entornos son evidencia histórica, no revalidada en esta integración. No describe
el estado publicado de la Home (`apps/public-site/`) ni sustituye sus revisiones.
Para la entrega Home consultar [HOMEPAGE.md](HOMEPAGE.md) y el apartado A de
[DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md). No trasladar estos datos a Home
ni activar servicios desde la automatización por inferencia.

Actualizado: 12 de septiembre de 2026. Estado: **NO-GO**.

Esta es la única hoja documental que mantiene las entradas externas vigentes y
los datos pendientes, sin reproducir valores de identidad o contacto redactados.
La fuente canónica del resultado y del recuento es
`npm run check:activation`; `ACTIVATION_GATE.md` define el contrato que aplica el
comando, `LEGAL_CHECKLIST.md` enumera los requisitos jurídicos y
`DEPLOYMENT_RUNBOOK.md` describe el proceso técnico de publicación. Esos
documentos no deben copiar este inventario.

No deben incluirse contrasenas, cookies, tokens, codigos MFA ni documentos con
mas datos personales de los necesarios. Las referencias documentales pueden ser
identificadores internos; los originales se conservan fuera del repositorio.

## Nombre, identidad y contacto

- [ ] Dictamen profesional favorable sobre disponibilidad registral y marcaria
  de `Obraxen`, con alcance territorial y clases revisadas.
- [ ] Razón social constituida y nombre legal exacto: sin dato en la fuente
  canónica; el valor anterior fue redactado.
- [ ] CIF/NIF de la sociedad: sin dato en la fuente canónica.
- [ ] Domicilio que pueda publicarse: sin dato en la fuente canónica.
- [x] Confirmación del responsable de que la sociedad está constituida, sin
  reproducir aquí su identidad legal.
- [ ] Teléfono para contacto: sin dato en la fuente canónica.

Responsable con capacidad para aprobar proveedor y publicación: **sin dato**.

## Legal y proveedor

- [ ] Revision profesional de aviso legal, privacidad, cookies y consentimiento,
  con revisor, fecha y referencia.
- [ ] Aprobacion del tratamiento de Resend: entidad contratante, DPA y
  transferencias, subencargados, tracking, conservacion, accesos y borrado.
  El dashboard autenticado muestra el DPA firmado por Resend y lo describe como
  plenamente ejecutado una vez creada la cuenta; todavía no hay dominio
  personalizado ni actividad de envío/recepción que valide el buzón de Obraxen.

La regla distribuida de limite de solicitudes para `/api/contact/` esta publicada
en Vercel para `Preview`: `POST`, por IP, 100 solicitudes por ventana fija de 60
segundos y respuesta `429`. `CONTACT_RATE_LIMIT_MODE=vercel-waf` tambien esta
registrado como variable de configuracion de `Preview`. Esta precondicion tecnica
queda satisfecha en ese entorno y no altera por si sola el resultado del gate.

## Idiomas

| Idioma | Revisor | Fecha | Referencia | Estado |
|---|---|---|---|---|
| Ingles | sin dato | sin dato | sin dato | Pendiente |
| Aleman | sin dato | sin dato | sin dato | Pendiente |
| Espanol | sin dato | sin dato | sin dato | Pendiente |
| Frances | sin dato | sin dato | sin dato | Pendiente |

La revision debe corresponder al SHA candidato exacto o entregar correcciones
identificadas por ruta.

## Casos y fotografias

El repositorio conserva para cada caso una declaración expresa del responsable:
los trabajos fueron ejecutados y existe autorización legal para publicar el
nombre del cliente y las fotografías web. Esta declaración no es el documento
de autorización ni una revisión legal verificada. La identidad, los presupuestos
y los originales se conservan fuera del repositorio; aquí solo se registran
referencias internas no sensibles.

| Caso | Evidencia registrada | Alcance declarado | Fecha | Referencia interna |
|---|---|---|---|---|
| delticom-hannover | Declaración del responsable | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E240002 |
| tp-link-dusseldorf | Declaración del responsable | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250007 |
| dadada-euskirchen | Declaración del responsable | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250006 |
| loreal-gauchy | Declaración del responsable | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250013 |
| blitz-bremen | Declaración del responsable | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E240001 |
| hologram-paris | Declaración del responsable | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250005 |

Para cerrar cada caso aún faltan una referencia verificable al documento que
cubre nombre y fotografías y la revisión legal de ese documento. La declaración
registrada no activa por sí sola ninguna superficie pública.

## Actualización y cierre

1. Verificar cada entrada contra su documento original.
2. Actualizar esta hoja y las fuentes estructuradas en una PR con manifiesto
   exacto, sin replicar el estado en los documentos de requisitos o proceso.
3. Ejecutar `npm run check:quality` y `npm run check:activation`.
4. Solo con cero incidencias solicitar autorización para una preview protegida.

Esta hoja no autoriza preview, contrato, despliegue, DNS web, formulario,
analitica, indexacion ni publicacion.
