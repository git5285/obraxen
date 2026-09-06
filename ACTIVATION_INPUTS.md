# Entradas pendientes para activar Obraxen

Actualizado: 6 de septiembre de 2026. Estado: **NO-GO**.

Esta es la única hoja documental que mantiene los valores y entradas externas
vigentes. La fuente canónica del resultado y del recuento es
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
- [x] Razon social constituida y nombre legal exacto: `OBRAXEN SURFACE S.L.`.
- [x] CIF/NIF de la sociedad: `B93963841`.
- [x] Domicilio que pueda publicarse: Calle Federico García Lorca 22.
- [x] Confirmacion del responsable de que la sociedad esta constituida.
- [x] Telefono temporal para contacto: `+34 653 916 970`.

Responsable con capacidad para aprobar proveedor y publicación: **sin dato**.

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

## Actualización y cierre

1. Verificar cada entrada contra su documento original.
2. Actualizar esta hoja y las fuentes estructuradas en una PR con manifiesto
   exacto, sin replicar el estado en los documentos de requisitos o proceso.
3. Ejecutar `npm run check:quality` y `npm run check:activation`.
4. Solo con cero incidencias solicitar autorización para una preview protegida.

Esta hoja no autoriza preview, contrato, despliegue, DNS web, formulario,
analitica, indexacion ni publicacion.
