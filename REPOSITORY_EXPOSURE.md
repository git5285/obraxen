# Revisión de exposición del repositorio

Fecha: 15 de julio de 2026. Estado: repositorio privado en GitHub Free por
decisión expresa del usuario; la web continúa sin autorización de despliegue o
publicación.

## Resultado

- No se detectan secretos, tokens, claves privadas, contraseñas, archivos `.env`
  ni credenciales de Vercel o GitHub en los archivos versionados.
- La dirección que figuraba en `data/brand.json` se ha sustituido por `null`: no
  existe todavía una sociedad ni un domicilio empresarial validado para publicar.
- Los informes locales de Lighthouse, Playwright y las auditorías externas quedan
  ignorados para evitar incorporarlos accidentalmente al repositorio público.
- `.env.example` solo documenta `GA_MEASUREMENT_ID` y `CLARITY_PROJECT_ID` con
  valores vacíos. No se ha versionado ningún ID real ni se reutiliza uno entre
  preview y producción.
- Los seis casos contienen nombres de clientes, ubicaciones, magnitudes y
  fotografías. La confirmación interna para identificar al cliente no equivale a
  soporte documental para publicar nombre y fotografías.
- `STRATEGY.md`, `research/sector-map.csv`, los borradores de datos y el historial
  de `.coordination/` estuvieron visibles mientras el repositorio fue público.
  No contienen credenciales, pero sí contexto estratégico y de ejecución.
- Los siete deployments Vercel legacy que conservaban la web estática provisional
  se eliminaron por ID el 15 de julio de 2026. El proyecto `remainon-web` permanece
  preparado, pero sin deployments, dominios ni alias accesibles; todas las URLs
  históricas comprobadas responden 404.

## Controles adoptados

1. Cada caso registra estado, alcance declarado, fuente, fecha, referencia
   documental y revisión legal de su autorización.
2. La puerta de publicación exige estado `documentada`, alcance para
   `nombre_cliente` y `fotografias_web`, referencia documental y revisión legal
   `aprobada` para todos los casos.
3. Los datos desconocidos se almacenan como `null`; no se publican direcciones ni
   años incompletos.
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

## Decisión de visibilidad

Se elige privacidad inmediata sin coste recurrente. GitHub Free no impone ramas
protegidas ni checks obligatorios en repositorios privados, por lo que la barrera
se compone de CI en cada PR, hook local versionado y protocolo obligatorio. Es una
decisión proporcionada mientras `git5285` sea el único colaborador con acceso.

Cambiar la visibilidad impide nuevas consultas no autorizadas, pero no elimina el
periodo de exposición previo ni revoca clones existentes. Tampoco elimina datos
del historial. Una reescritura solo se considerará si aparece un dato que exija
retirada o rotación; no se ha detectado esa condición en la revisión actual.

GitHub Pro y GitLab Free quedan como alternativas si se necesita enforcement
remoto para más colaboradores. La decisión completa se registra en ADR-009.

## Comprobación repetible

La revisión cubre archivos versionados y patrones de claves API, secretos,
tokens, credenciales, claves privadas, emails, teléfonos y direcciones. Debe
repetirse antes de cada publicación y al incorporar un nuevo proveedor.
