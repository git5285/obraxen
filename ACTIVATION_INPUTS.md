# Entradas pendientes para activar Obraxen

Estado: **NO-GO**. Esta hoja organiza las entradas externas; la fuente canónica
del estado y del recuento es `npm run check:activation`. `ACTIVATION_GATE.md`
describe el contrato, pero no sustituye la salida ejecutable.

No deben incluirse contrasenas, cookies, tokens, codigos MFA ni documentos con
mas datos personales de los necesarios. Las referencias documentales pueden ser
identificadores internos; los originales se conservan fuera del repositorio.

## Nombre, identidad y contacto

- [ ] Dictamen profesional favorable sobre disponibilidad registral y marcaria
  de `Obraxen`, con alcance territorial y clases revisadas.
- [ ] Razon social constituida y nombre legal exacto.
- [ ] CIF/NIF de la sociedad.
- [ ] Domicilio que pueda publicarse.
- [ ] Confirmacion documental de que la sociedad esta constituida.
- [ ] Telefono o WhatsApp autorizado para publicacion.

Responsable con capacidad para aprobar proveedor y publicacion: **sin dato**.

## Legal y proveedor

- [ ] Revision profesional de aviso legal, privacidad, cookies y consentimiento,
  con revisor, fecha y referencia.
- [ ] Aprobacion del tratamiento de Resend: entidad contratante, DPA y
  transferencias, subencargados, tracking, conservacion, accesos y borrado.

La regla distribuida de limite de solicitudes para `/api/contact/` es una
precondicion tecnica adicional y no altera por si sola el resultado del gate.

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

## Criterio de cierre

1. Verificar cada entrada contra su documento original.
2. Actualizar datos y textos en una PR con manifiesto exacto.
3. Ejecutar `npm run check:quality` y `npm run check:activation`.
4. Solo con cero incidencias solicitar autorizacion para una preview protegida.

Esta hoja no autoriza preview, contrato, despliegue, DNS web, formulario,
analitica, indexacion ni publicacion.
