# Checklist legal antes de producción

Estado: **bloqueado**. Los textos de `aviso-legal` y `privacidad` son borradores
de trabajo y no sustituyen la revisión de un profesional.

Situación societaria confirmada: la empresa **todavía no está constituida**. La
forma jurídica prevista es una **sociedad limitada**. `Obraxen` está seleccionado
por el usuario como nombre comercial y `obraxen.com`, `info@obraxen.com` y
`privacy@obraxen.com` están acreditados operativamente. Esto no equivale a razón
social ni a disponibilidad registral o marcaria. El identificador temporal
anterior queda únicamente en el historial. La constitución sigue pendiente y no deben
rellenarse datos legales provisionales.

La comprobación preliminar documentada en `NAMING_CLEARANCE.md` encontró usos
exactos de `OBRAZEN` en construcción e ingeniería. La publicación exige un
dictamen profesional favorable y `nombreRevisionAprobada: true`.

## Datos pendientes

- Constitución de la sociedad limitada.
- Razón social, CIF/NIF y datos registrales resultantes de la constitución.
- Teléfono o WhatsApp publicable.
- Datos del Registro Mercantil, si resultan aplicables.
- Proveedor definitivo del formulario y contrato de encargo de tratamiento.
- Proveedores definitivos de alojamiento, correo y recursos técnicos.
- IDs y propiedades definitivas de GA4 y Microsoft Clarity por entorno.
- Revisión de conservación, transferencias y configuración de ambos proveedores.
- Revisión profesional y aprobación registrada de las versiones en inglés,
  alemán, español y francés, incluidos textos legales y consentimiento.

## Autorizaciones de casos y fotografías

Los seis casos registran una confirmación interna para identificar al cliente,
pero ninguno dispone todavía de referencia documental ni revisión legal aprobada.
El alcance declarado no cubre las fotografías web. Por tanto, los casos no
superan todavía la puerta de publicación final aunque puedan utilizarse en la
preview local cerrada.

Antes de publicar cada caso se debe registrar:

- entidad que autoriza y relación con la obra ejecutada;
- alcance exacto: nombre del cliente, fotografías y, si aparece, logotipo;
- fecha, fuente y referencia verificable del documento o contrato;
- titularidad o licencia suficiente sobre las fotografías;
- revisión legal aprobada o anonimización del caso.

`autorizacionPublicacion.estado` solo puede pasar a `documentada` cuando exista
ese soporte. Una confirmación interna o la entrega de archivos no se convierte
automáticamente en autorización comercial.

## Decisiones técnicas pendientes

- Resend es el adaptador técnico seleccionado, pero no debe activarse hasta
  aceptar y archivar el DPA, revisar subencargados, ubicación, conservación y
  transferencias, y registrar `formularioRevisionAprobada: true`.
- Antes de activar `/api/contact/` debe existir y probarse una regla externa de
  limitación de solicitudes para esa ruta. Solo entonces puede configurarse
  `CONTACT_RATE_LIMIT_MODE=vercel-waf`; el límite en memoria de la aplicación es
  una defensa secundaria y no garantiza control distribuido entre instancias.
- El formulario no almacena leads en una base propia ni admite adjuntos. El buzón
  receptor será el sistema de conservación y necesita plazos, accesos, borrado y
  medidas de seguridad definidos.
- La preview no solicita fuentes ni scripts a terceros: utiliza tipografías del
  sistema y animación CSS/JavaScript nativo.
- El panel, la ruta `/cookies/` y las pruebas de consentimiento están
  implementados. La preferencia se conserva 180 días en almacenamiento local;
  aceptar y rechazar tienen igual visibilidad y la retirada permanece accesible.
- GA4 y Microsoft Clarity no se cargan antes de aceptar. Los IDs reales siguen
  ausentes, la publicidad permanece denegada y las pruebas demuestran cero
  solicitudes de analítica cuando se rechaza.
- La CSP permite únicamente los orígenes técnicos necesarios para una futura
  activación; permitir un origen no activa el proveedor. Search Console se
  configurará únicamente tras conectar la web al dominio y autorizar la
  indexación, no por la mera existencia de `obraxen.com`.
- Antes de activar Clarity debe confirmarse en su panel el modo de consentimiento,
  el enmascarado y la configuración separada de producción. Antes de activar GA4
  debe revisarse la propiedad, retención, señales de Google y ausencia de
  funciones publicitarias.

## Comprobación final

1. Completar `data/brand.json`.
2. Revisar aviso legal, privacidad y cookies con asesoría legal.
3. Documentar o anonimizar cada caso y sus fotografías.
4. Cambiar `legalRevisionAprobada` a `true` solo después de esa revisión.
5. Registrar revisor y fecha para en/de/es/fr solo después de revisión profesional.
6. Aprobar el proveedor de captación, verificar dominio, buzones y DPA, y probar
   el límite externo de solicitudes de `/api/contact/`.
7. Activar `publicar` únicamente cuando el build no detecte ningún dato pendiente.

## Fuentes oficiales consultadas

Enlaces comprobados el 15 de julio de 2026:

- [Ley 34/2002, especialmente el artículo 10](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758).
- [Reglamento (UE) 2016/679, especialmente los artículos 6 y 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa).
- [Ley Orgánica 3/2018](https://www.boe.es/eli/es/lo/2018/12/05/3/con).
- [Agencia Española de Protección de Datos](https://www.aepd.es/), para deber de
  información y bases de legitimación.
- [DPA de Resend](https://resend.com/legal/dpa), sujeto a revisión profesional y
  archivo de la versión aceptada antes de activar.
