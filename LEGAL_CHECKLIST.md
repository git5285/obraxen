# Checklist legal antes de producción

Estado: **bloqueado**. Los textos de `aviso-legal` y `privacidad` son borradores
de trabajo y no sustituyen la revisión de un profesional.

Situación societaria confirmada: la empresa **todavía no está constituida**. La
forma jurídica prevista es una **sociedad limitada**. “RemainOn” es solo un nombre
interno temporal y no puede utilizarse como nombre comercial ni razón social. El
análisis de nombres no autoriza todavía una selección ni integración; la
constitución sigue pendiente y no deben rellenarse datos provisionales.

## Datos pendientes

- Nombre comercial definitivo.
- Constitución de la sociedad limitada.
- Razón social, CIF/NIF y datos registrales resultantes de la constitución.
- Email de contacto y de ejercicio de derechos.
- Dominio definitivo.
- Datos del Registro Mercantil, si resultan aplicables.
- Proveedor definitivo del formulario y contrato de encargo de tratamiento.
- Proveedores definitivos de alojamiento, correo y recursos técnicos.

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

- Formspree no debe activarse hasta disponer de cuenta, endpoint, email y revisión
  de su ubicación, conservación, contrato y transferencias internacionales.
- La preview no solicita fuentes ni scripts a terceros: utiliza tipografías del
  sistema y animación CSS/JavaScript nativo.
- Actualmente no hay analítica, publicidad ni cookies propias no esenciales. Si
  se añade alguna herramienta que las utilice, habrá que implementar información,
  rechazo y configuración antes de activarla.
- GA4 y Microsoft Clarity permanecerán desactivados hasta implementar y probar
  consentimiento. Search Console se configurará cuando exista dominio.

## Comprobación final

1. Completar `data/brand.json`.
2. Revisar los dos textos con asesoría legal.
3. Documentar o anonimizar cada caso y sus fotografías.
4. Cambiar `legalRevisionAprobada` a `true` solo después de esa revisión.
5. Activar `publicar` únicamente cuando el build no detecte ningún dato pendiente.

## Fuentes oficiales consultadas

Enlaces comprobados el 14 de julio de 2026:

- [Ley 34/2002, especialmente el artículo 10](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758).
- [Reglamento (UE) 2016/679, especialmente los artículos 6 y 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa).
- [Ley Orgánica 3/2018](https://www.boe.es/eli/es/lo/2018/12/05/3/con).
- [Agencia Española de Protección de Datos](https://www.aepd.es/), para deber de
  información y bases de legitimación.
