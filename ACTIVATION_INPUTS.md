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
precondicion tecnica adicional y no forma parte del recuento de 36.

## Idiomas: 4 incidencias

| Idioma | Revisor | Fecha | Referencia | Estado |
|---|---|---|---|---|
| Ingles | sin dato | sin dato | sin dato | Pendiente |
| Aleman | sin dato | sin dato | sin dato | Pendiente |
| Espanol | sin dato | sin dato | sin dato | Pendiente |
| Frances | sin dato | sin dato | sin dato | Pendiente |

La revision debe corresponder al SHA candidato exacto o entregar correcciones
identificadas por ruta.

## Casos y fotografias: 24 incidencias

Cada caso necesita las cuatro evidencias siguientes: autorizacion documentada,
cobertura de fotografias web, referencia documental y revision legal aprobada.

| Caso | Entidad autorizante | Alcance | Fecha | Referencia | Revision legal |
|---|---|---|---|---|---|
| delticom-hannover | sin dato | sin dato | sin dato | sin dato | Pendiente |
| tp-link-dusseldorf | sin dato | sin dato | sin dato | sin dato | Pendiente |
| dadada-euskirchen | sin dato | sin dato | sin dato | sin dato | Pendiente |
| loreal-gauchy | sin dato | sin dato | sin dato | sin dato | Pendiente |
| blitz-bremen | sin dato | sin dato | sin dato | sin dato | Pendiente |
| hologram-paris | sin dato | sin dato | sin dato | sin dato | Pendiente |

Si un permiso no puede acreditarse, la alternativa es anonimizar o retirar por
completo nombre, imagenes y elementos identificables antes de crear candidata.

## Criterio de cierre

1. Verificar cada entrada contra su documento original.
2. Actualizar datos y textos en una PR con manifiesto exacto.
3. Ejecutar `npm run check:quality` y `npm run check:activation`.
4. Solo con cero incidencias solicitar autorizacion para una preview protegida.

Esta hoja no autoriza preview, contrato, despliegue, DNS web, formulario,
analitica, indexacion ni publicacion.
