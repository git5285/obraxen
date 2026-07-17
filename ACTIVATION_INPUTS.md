# Entradas pendientes para activar Obraxen

Estado: **NO-GO**. Esta hoja organiza las entradas externas; la fuente ejecutable
sigue siendo `ACTIVATION_GATE.md` y `npm run check:activation`.

No deben incluirse contrasenas, cookies, tokens, codigos MFA ni documentos con
mas datos personales de los necesarios. Las referencias documentales pueden ser
identificadores internos; los originales se conservan fuera del repositorio.

## Nombre, identidad y contacto: 6 incidencias

- [ ] Dictamen profesional favorable sobre disponibilidad registral y marcaria
  de `Obraxen`, con alcance territorial y clases revisadas.
- [ ] Razon social constituida y nombre legal exacto.
- [ ] CIF/NIF de la sociedad.
- [ ] Domicilio que pueda publicarse.
- [ ] Confirmacion documental de que la sociedad esta constituida.
- [ ] Telefono o WhatsApp autorizado para publicacion.

Responsable con capacidad para aprobar proveedor y publicacion: **sin dato**.

## Legal y proveedor: 2 incidencias

- [ ] Revision profesional de aviso legal, privacidad, cookies y consentimiento,
  con revisor, fecha y referencia.
- [ ] Aprobacion del tratamiento de Resend: entidad contratante, DPA y
  transferencias, subencargados, tracking, conservacion, accesos y borrado.

La regla distribuida de limite de solicitudes para `/api/contact/` es una
precondicion tecnica adicional y no forma parte del recuento de 12.

## Idiomas: 4 incidencias

| Idioma | Revisor | Fecha | Referencia | Estado |
|---|---|---|---|---|
| Ingles | sin dato | sin dato | sin dato | Pendiente |
| Aleman | sin dato | sin dato | sin dato | Pendiente |
| Espanol | sin dato | sin dato | sin dato | Pendiente |
| Frances | sin dato | sin dato | sin dato | Pendiente |

La revision debe corresponder al SHA candidato exacto o entregar correcciones
identificadas por ruta.

## Casos y fotografias: 0 incidencias

El responsable ha declarado expresamente que los seis trabajos fueron ejecutados
y que existe autorizacion legal total para publicar el nombre del cliente y las
fotografias web. La identidad, los presupuestos y los originales se conservan
fuera del repositorio; solo se registran referencias internas no sensibles.

| Caso | Entidad autorizante | Alcance | Fecha | Referencia | Revision legal |
|---|---|---|---|---|---|
| delticom-hannover | Responsable autorizado | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E240002 | Aprobada |
| tp-link-dusseldorf | Responsable autorizado | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250007 | Aprobada |
| dadada-euskirchen | Responsable autorizado | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250006 | Aprobada |
| loreal-gauchy | Responsable autorizado | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250013 | Aprobada |
| blitz-bremen | Responsable autorizado | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E240001 | Aprobada |
| hologram-paris | Responsable autorizado | Nombre y fotografias web | 2026-07-17 | AUTH-RESP-20260717-E250005 | Aprobada |

La autorizacion de los casos no resuelve las 12 entradas restantes de identidad,
legal/proveedor e idiomas y no activa por si sola ninguna superficie publica.

## Criterio de cierre

1. Verificar cada entrada contra su documento original.
2. Actualizar datos y textos en una PR con manifiesto exacto.
3. Ejecutar `npm run check:quality` y `npm run check:activation`.
4. Solo con cero incidencias solicitar autorizacion para una preview protegida.

Esta hoja no autoriza preview, contrato, despliegue, DNS web, formulario,
analitica, indexacion ni publicacion.
