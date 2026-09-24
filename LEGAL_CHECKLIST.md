# Requisitos legales antes de producción

Alcance operativo: datos y contrato interno en `domain/publication/`, heredados del
legado retirado. Las referencias a formulario, cuatro idiomas y límites de API
son requisitos para una eventual reintroducción, no funciones actuales de Home. Para la Home
actual (`apps/public-site/`) revisar sus fuentes y el apartado A de
[DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md). Separar aplicaciones no exime de
revisar los requisitos legales aplicables, no acredita datos ni concede permisos.
La automatización interna no puede suplir las revisiones profesionales.

Este documento define requisitos y evidencias de aprobación. No mantiene el
estado cambiante de identidad, contacto o expedientes: consúltese
`ACTIVATION_INPUTS.md`. El resultado ejecutable procede de
`npm run check:activation` y su contrato está en `ACTIVATION_GATE.md`.

Los textos de aviso legal, privacidad, cookies y consentimiento son borradores
de trabajo hasta que una revisión profesional identifique el entregable, el
revisor, la fecha y el resultado. Este checklist no constituye asesoramiento
jurídico ni autoriza preview, despliegue, indexación o publicación.

## Identificación del prestador

Antes de publicar, el aviso legal debe obtener desde `data/brand.json` y mostrar
solo los datos aplicables y acreditados:

- denominación social y NIF;
- domicilio y medios de contacto publicables;
- datos del Registro Mercantil cuando resulten legalmente exigibles;
- actividad y demás información exigible al prestador;
- responsable con capacidad para aprobar la publicación.

La revisión debe comprobar la correspondencia entre la fuente estructurada, los
textos renderizados y la documentación societaria. La existencia de un valor en
el repositorio no sustituye esa revisión.

## Privacidad, cookies y consentimiento

La revisión profesional debe cubrir conjuntamente:

- responsable, finalidades, bases jurídicas, destinatarios y derechos;
- plazos de conservación y procedimiento de supresión;
- transferencias internacionales y garantías aplicables;
- cookies, almacenamiento local, retirada del consentimiento y caducidad;
- coherencia entre aviso legal, privacidad, cookies, formulario y panel de
  consentimiento en los cuatro idiomas;
- ausencia de analítica, publicidad o captación antes de la condición aprobada.

Cada versión aprobada debe quedar vinculada al SHA o a un conjunto inequívoco de
rutas y textos.

## Proveedores y formulario

Antes de activar Resend o cualquier sustituto deben quedar archivados y
aprobados:

- entidad contratante y responsable que acepta el proveedor;
- DPA y versión de los términos aplicables;
- subencargados, localización, transferencias y mecanismo de garantía;
- datos transmitidos, tracking, accesos, conservación y borrado;
- procedimiento para derechos, incidentes y terminación del servicio;
- buzón receptor, responsables de acceso y plazo de conservación;
- regla distribuida de limitación de solicitudes para `/api/contact/` probada en
  el proveedor de borde.

El límite en memoria de la aplicación es una defensa secundaria y no acredita
control distribuido entre instancias.

## Nombre comercial

La comprobación preliminar de `NAMING_CLEARANCE.md` no acredita disponibilidad.
La publicación exige un dictamen profesional favorable que identifique revisor,
fecha, territorio, clases, búsquedas realizadas, resultado y referencia del
entregable.

## Casos y fotografías

Antes de publicar cada caso debe existir una de estas dos vías:

1. Documento verificable que cubra nombre, fotografías y logotipo cuando
   corresponda, junto con revisión legal aprobada del mismo documento.
2. Anonimización o retirada completa de los elementos sin cobertura.

La evidencia debe identificar entidad autorizante, relación con la obra,
alcance, fecha, fuente, referencia documental y derechos suficientes sobre las
fotografías. Una declaración interna no sustituye el documento ni su revisión.
Los originales y datos personales se conservan fuera del repositorio.

## Registro de aprobación

Una aprobación válida debe registrar:

- profesional o despacho revisor;
- fecha y territorio o ámbito cubierto;
- documento y versión revisados mediante referencia estable;
- decisión favorable, desfavorable o condicionada;
- condiciones pendientes y responsable de resolverlas.

Solo después se actualizan las fuentes estructuradas mediante PR y se ejecutan
`npm run check:quality` y `npm run check:activation`. Un resultado sin bloqueos
permite solicitar una preview protegida; no equivale a autorizar publicación.

## Referencias oficiales

- [Ley 34/2002, especialmente el artículo 10](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758).
- [Reglamento (UE) 2016/679, especialmente los artículos 6 y 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa).
- [Ley Orgánica 3/2018](https://www.boe.es/eli/es/lo/2018/12/05/3/con).
- [Agencia Española de Protección de Datos](https://www.aepd.es/).
- [DPA de Resend](https://resend.com/legal/dpa), sujeto a revisión profesional
  y archivo de la versión aceptada antes de activar.
