# Revisión de exposición del repositorio

Actualizado: 12 de septiembre de 2026. Estado: repositorio privado en GitHub Free por
decisión expresa del usuario; la web continúa sin publicación autorizada y el
bootstrap `production` no está operativo.

## Resultado

- No se detectan secretos, tokens, claves privadas, contraseñas, archivos `.env`
  ni credenciales de Vercel o GitHub en los archivos versionados.
- `data/brand.json` conserva únicamente la marca, el dominio y el estado de los
  gates; los campos de identidad legal y contacto están redactados como `null`,
  y `nombreRevisionAprobada`, `legalRevisionAprobada` y
  `formularioRevisionAprobada` siguen en `false`.
- Los informes locales de Lighthouse, Playwright y las auditorías externas quedan
  ignorados para evitar incorporarlos accidentalmente al repositorio público.
- `.env.example` documenta `GA_MEASUREMENT_ID`, `CLARITY_PROJECT_ID` y la
  configuración fail-closed de contacto (`CONTACT_FORM_ENABLED`, límites y
  variables de Resend), todos sin valores reales. No se ha versionado ningún ID,
  token o secreto ni se reutiliza uno entre preview y producción.
- Los seis casos conservan registros técnicos internos, nombres de cliente y
  ubicaciones, pero sus fotografías y referencias a assets fueron retiradas y no
  pueden entrar en el catálogo público sin un nuevo expediente aprobado.
- `STRATEGY.md`, `research/sector-map.csv`, los borradores de datos y el historial
  de `.coordination/` estuvieron visibles mientras el repositorio fue público.
  No contienen credenciales, pero sí contexto estratégico y de ejecución.
- `data/proyectos.borrador.json` se retiró del árbol Git actual y su ruta quedó
  ignorada para evitar reintroducciones accidentales. La retirada no borra el
  archivo de commits anteriores, clones existentes ni copias obtenidas durante
  el periodo de exposición.
- Los siete deployments Vercel legacy que conservaban la web estática provisional
  se eliminaron por ID el 15 de julio de 2026. El proyecto fue renombrado a
  `obraxen`; el bootstrap `production` autorizado el 12 de septiembre de 2026
  dejó un único deployment en estado `ERROR`, sin deployment operativo ni
  publicación aprobada. No se promocionó ningún alias o dominio personalizado.

## Controles adoptados

1. Cada caso conserva evidencias separadas por tipo: declaración del responsable,
   documento referenciado y revisión legal verificada.
2. La puerta de publicación no promueve una declaración. Exige un
   `documento_referenciado` con alcance para `nombre_cliente` y
   `fotografias_web`, y una `revision_legal_verificada` aprobada que enlace ese
   mismo documento.
3. Los datos desconocidos se almacenan como `null`; las declaraciones de identidad
   permanecen detrás de sus banderas de revisión y no se publican direcciones ni
   años incompletos sin autorización.
4. `vercel.json` mantiene los despliegues Git desactivados. La visibilidad del
   código no autoriza la visibilidad de la web.
5. Los IDs de medición son identificadores públicos, no secretos de autenticación,
   pero se configuran por entorno y el navegador solo los solicita tras aceptar.
   Cualquier secreto administrativo de Google, Microsoft o Vercel queda fuera del
   repositorio y nunca debe exponerse desde `/api/analytics-config/`.
6. El repositorio es privado. GitHub Actions mantiene `Quality gate` para cada PR,
   y `.githooks/pre-push` bloquea pushes directos a `main` y ejecuta el gate local
   antes de subir ramas.
7. `AGENTS.md` prohíbe omitir el hook o fusionar un SHA cuyo check remoto no esté
   verde. La protección se reevalúa si aumenta el número de colaboradores.
8. Los borradores de trabajo precontractuales se mantienen fuera del árbol
   versionado; el sitio y el gate de activación solo consumen `data/proyectos.json`.
   Sus nombres y ubicaciones siguen siendo internos y los arrays de fotografías
   están vacíos; la puerta de publicación exige además un expediente aprobado y
   assets nuevos autorizados.

## Decisión de visibilidad

Se elige privacidad inmediata sin coste recurrente. GitHub Free no impone ramas
protegidas ni checks obligatorios en repositorios privados, por lo que la barrera
se compone de CI en cada PR, hook local versionado y protocolo obligatorio. Es una
decisión proporcionada mientras `git5285` sea el único colaborador con acceso.

Cambiar la visibilidad impide nuevas consultas no autorizadas, pero no elimina el
periodo de exposición previo ni revoca clones existentes. El árbol actual ya no
contiene las fotografías ni los campos de identidad/contacto redactados, pero los
commits históricos pueden conservar copias anteriores. Una reescritura solo se
considerará mediante un procedimiento coordinado si la revisión legal confirma
que la retirada histórica es necesaria.

GitHub Pro y GitLab Free quedan como alternativas si se necesita enforcement
remoto para más colaboradores. La decisión completa se registra en ADR-009.

## Evidencia del cambio

- La API de GitHub devuelve `visibility: PRIVATE` e `isPrivate: true`.
- Una solicitud web sin autenticar a la URL del repositorio devuelve HTTP 404.
- GitHub Actions permanece habilitado y la PR de cambio completó `Quality gate`
  correctamente; el job de preview Vercel quedó omitido.
- La consulta autenticada del proyecto Vercel devuelve un único deployment
  `production` en estado `ERROR`; el reintento autorizado fue rechazado antes de
  crear otro deployment por el límite de contexto del conector.
- La lista de colaboradores contiene únicamente a `git5285` con rol administrador.
- La consulta de branch protection devuelve HTTP 403 con la indicación de pasar
  a GitHub Pro o volver a público, que confirma el límite aceptado por ADR-009.

## Comprobación repetible

La revisión cubre archivos versionados y patrones de claves API, secretos,
tokens, credenciales, claves privadas, emails, teléfonos y direcciones. Debe
repetirse antes de cada publicación y al incorporar un nuevo proveedor.
